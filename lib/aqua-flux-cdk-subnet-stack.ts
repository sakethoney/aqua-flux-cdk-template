import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class AquaFluxSubnetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing VPC from the previous stack
    const vpc = ec2.Vpc.fromLookup(this, 'MyAquaVPC', {
      vpcName: 'AquaFluxCdkTemplateStack/MyAquaVPC'
    });

    /*
        // ✅ Import Existing VPC using Lookup
         const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
          vpcId: 'vpc-xxxxxxxx', // 🔥 Replace with your actual VPC ID
    });
    */
   
    // Add Public Subnet
    const publicSubnet = new ec2.PublicSubnet(this, 'PublicSubnet', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a'
    });

    // Add Private Subnet
    const privateSubnet = new ec2.PrivateSubnet(this, 'PrivateSubnet', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b'
    });

    // Output Subnet IDs
    new cdk.CfnOutput(this, 'PublicSubnetId', { value: publicSubnet.subnetId });
    new cdk.CfnOutput(this, 'PrivateSubnetId', { value: privateSubnet.subnetId });
  }
}
