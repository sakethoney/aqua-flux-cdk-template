import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AquaEcsClusterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Import Existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'MyAquaVPC', {
      vpcId: 'vpc-xxxxxxxx' // 🔥 Replace with your actual VPC ID from CDK output
    });
        // ✅ Import Private Subnets Manually
        //const privateSubnets = [
          //  ec2.Subnet.fromSubnetId(this, 'PrivateSubnet1', 'subnet-xxxxxxxx'), // 🔥 Replace with your actual private subnet ID
          //  ec2.Subnet.fromSubnetId(this, 'PrivateSubnet2', 'subnet-yyyyyyyy') // 🔥 If you have multiple private subnets
         // ];
      

    // ✅ Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'MyAquaMicroserviceCluster', {
      vpc,
      clusterName: 'MySpringBootCluster',
    });

    // ✅ Create an ECR Repository (to store Docker images)
    const ecrRepo = new ecr.Repository(this, 'SpringBootEcrRepo', {
      repositoryName: 'aquaflux-microservice',
    });

    // ✅ Create IAM Role for ECS Task Execution
    const taskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy"),
      ],
    });

    // ✅ Define ECS Task Definition (for Fargate)
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'SpringBootTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
    });

    // ✅ Add Container to the Task Definition
    const container = taskDefinition.addContainer('SpringBootContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'), // 🔥 Replace 'latest' with correct tag if needed
      memoryLimitMiB: 512,
      cpu: 256,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'springboot' }),
    });

    // ✅ Expose port 8080 for the Spring Boot app
    container.addPortMappings({
      containerPort: 8080,
    });

    // ✅ Create ECS Fargate Service (Running in Private Subnet)
    const ecsService = new ecs.FargateService(this, 'SpringBootService', {
      cluster,
      taskDefinition,
      desiredCount: 2, // Running 2 instances
      assignPublicIp: false, // Runs in the private subnet
      minHealthyPercent: 100, // Ensures tasks are not killed during deployment
      maxHealthyPercent: 200, // Allows up to 2x desired count for smooth rolling update
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ✅ Output ECS Cluster Name & ECR Repository URL
    new cdk.CfnOutput(this, 'EcsClusterName', { value: cluster.clusterName });
    new cdk.CfnOutput(this, 'EcrRepositoryUrl', { value: ecrRepo.repositoryUri });
  }
}
