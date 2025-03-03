import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class AquaNatGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Import Existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'MyAquaVPC', {
      vpcId: 'vpc-xxxxxxxx' // 🔥 Replace with your actual VPC ID from CDK output
    });

    // ✅ Import Public Subnet (Attach NAT Gateway Here)
    const publicSubnet = ec2.Subnet.fromSubnetId(this, 'PublicSubnet', 'subnet-xxxxxxxx'); // 🔥 Replace with your Public Subnet ID

    // ✅ Import Private Subnet (Route Traffic Through NAT GW)
    const privateSubnet = ec2.Subnet.fromSubnetId(this, 'PrivateSubnet', 'subnet-yyyyyyyy'); // 🔥 Replace with your Private Subnet ID

    // ✅ Allocate an Elastic IP for NAT Gateway
    const natEip = new ec2.CfnEIP(this, 'NatEIP', {});

    // ✅ Create a NAT Gateway in Public Subnet
    const natGateway = new ec2.CfnNatGateway(this, 'NatGateway', {
      allocationId: natEip.attrAllocationId,
      subnetId: publicSubnet.subnetId,
      tags: [{ key: 'Name', value: 'MyAquaNatGateway' }]
    });

    // ✅ Create a Private Route Table
    const privateRouteTable = new ec2.CfnRouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.vpcId,
      tags: [{ key: 'Name', value: 'PrivateRouteTable' }]
    });

    // ✅ Add Route: 0.0.0.0/0 → NAT Gateway (For Outbound Internet)
    new ec2.CfnRoute(this, 'PrivateRoute', {
      routeTableId: privateRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.ref
    });

    // ✅ Associate Private Subnet with Private Route Table
    new ec2.CfnSubnetRouteTableAssociation(this, 'PrivateSubnetRouteTableAssociation', {
      subnetId: privateSubnet.subnetId,
      routeTableId: privateRouteTable.ref
    });

    // ✅ Output NAT Gateway ID
    new cdk.CfnOutput(this, 'NatGatewayId', { value: natGateway.ref });
  }
}
