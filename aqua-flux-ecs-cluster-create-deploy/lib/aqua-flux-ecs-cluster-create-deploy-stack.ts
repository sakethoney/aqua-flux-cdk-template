import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';

export class PrivateProductFargateEcsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpcId = 'vpc-xxxxxxxxx';
        const privateSubnetIds = ['subnet-xxxxxxxxx','subnet-yyyyyyyy']; // Replace with private subnet IDs
        const privateRouteTable1Ids = ['rtb-xxxxxxxxxx','rtb-yyyyyyy'];

        // Import existing VPC
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVPC', {
            vpcId: vpcId,
            availabilityZones: ['us-east-1a', 'us-east-1b'], // Adjust based on your region
            privateSubnetIds: privateSubnetIds,
            privateSubnetRouteTableIds: privateRouteTable1Ids,
        });

        // Import existing private subnets with route table IDs
        const privateSubnets = privateSubnetIds.map((id, index) =>
            ec2.Subnet.fromSubnetAttributes(this, `PrivateSubnet-${id}`, {
                subnetId: id,
                routeTableId: privateRouteTable1Ids[index],
                availabilityZone: ['us-east-1a', 'us-east-1b'][index],
            })
        );

        // Import existing ECR Repository
        const ecrRepo = ecr.Repository.fromRepositoryName(this, 'EcrProductRepo', 'aqua-flux-product-service');

        // Create an ECS Cluster
        const cluster = new ecs.Cluster(this, 'FargateProductCluster', { vpc });

        // Define a Fargate Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'ProductTaskDef', {
            cpu: 512, // 0.5 vCPU
            memoryLimitMiB: 1024, // 1GB RAM
        });

        // Add container from existing ECR repository
        const container = taskDefinition.addContainer('ProductAppContainer', {
            image: ecs.ContainerImage.fromEcrRepository(ecrRepo),
            logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-product-app' }),
            memoryLimitMiB: 1024,
        });

        container.addPortMappings({
            containerPort: 8080,
            protocol: ecs.Protocol.TCP,
        });

        // Create a Private Application Load Balancer
        const alb = new elbv2.ApplicationLoadBalancer(this, 'PrivateALB', {
            vpc,
            internetFacing: false, // This makes it private
            vpcSubnets: { subnets: privateSubnets },
        });

        // Create the ECS Fargate Service inside Private Subnets with an Internal Load Balancer
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'FargateProductService', {
            cluster,
            taskDefinition,
            desiredCount: 2,
            publicLoadBalancer: false, // ALB is private
            loadBalancer: alb, // Use the explicitly created ALB
            listenerPort: 80, // Define the listener port
        });

        // ✅ Configure Health Check on the Target Group (Spring Boot Actuator)
        fargateService.targetGroup.configureHealthCheck({
            path: "/actuator/health",
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3,
            port: "traffic-port"
        });

        // ✅ Fix ECS Deployment Behavior (Ensures No Downtime During Deployment)
        fargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');
        fargateService.service.autoScaleTaskCount({ maxCapacity: 4 }).scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 50,
        });

        // ✅ Set Deployment Circuit Breaker (Ensures Safe Rollback on Failure)
        (fargateService.service.node.defaultChild as ecs.CfnService).addPropertyOverride('DeploymentConfiguration', {
            DeploymentCircuitBreaker: {
                Enable: true,
                Rollback: true,
            },
            MinimumHealthyPercent: 100,
            MaximumPercent: 200,
        });

        // Allow ALB to communicate with Fargate tasks
        fargateService.service.connections.allowFrom(alb, ec2.Port.tcp(80));

        // Output the internal ALB DNS name (accessible only inside the VPC)
        new cdk.CfnOutput(this, 'PrivateALBDNS', {
            value: alb.loadBalancerDnsName,
            description: 'Private ALB DNS Name (accessible only inside the VPC)',
        });
    }
}
