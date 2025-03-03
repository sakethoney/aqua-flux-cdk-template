import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AquaFluxCdkTemplateStack extends cdk.Stack {

  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    this.vpc = new ec2.Vpc(this, 'MyAquaVPC', {
      maxAzs: 1, // Maximum Availability Zones
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // Custom CIDR block
      subnetConfiguration: [] // No subnets yet, we will add them in the next step
    });

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
