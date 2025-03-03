import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class AquaFluxInternetGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Import the existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: 'vpc-xxxxxxxx' // 🔥 Replace with your actual VPC ID from CDK output
    });

    // ✅ Create an Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, 'InternetGateway', {
      tags: [{ key: 'Name', value: 'MyAquaInternetGateway' }]
    });

    // ✅ Attach IGW to the VPC
    new ec2.CfnVPCGatewayAttachment(this, 'IgwAttachment', {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref
    });

    // ✅ Create a Public Route Table
    const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.vpcId,
      tags: [{ key: 'Name', value: 'AquaPublicRouteTable' }]
    });

    // ✅ Add a Route to IGW (0.0.0.0/0 → Internet)
    new ec2.CfnRoute(this, 'PublicRoute', {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref
    });

    // ✅ Get the Public Subnet (Lookup)
    const publicSubnet = ec2.Subnet.fromSubnetId(this, 'PublicSubnet', 'subnet-xxxxxxxx'); // 🔥 Replace with your Public Subnet ID

    // ✅ Associate Public Subnet with Route Table
    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnetRouteTableAssociation', {
      subnetId: publicSubnet.subnetId,
      routeTableId: publicRouteTable.ref
    });

    // ✅ Output Internet Gateway ID
    new cdk.CfnOutput(this, 'InternetGatewayId', { value: igw.ref });
  }
}
