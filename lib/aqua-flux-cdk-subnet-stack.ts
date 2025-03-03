import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class AquaFluxSubnetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Import Existing VPC
    const vpc = ec2.Vpc.fromLookup(this, "MyAquaVPC", {
      vpcId: "vpc-xxxxxxxx", // 🔥 Replace with actual VPC ID
    });

    // ✅ Create Public Subnet
    const publicSubnet = new ec2.PublicSubnet(this, "PublicSubnet", {
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: `${this.region}a`,
      mapPublicIpOnLaunch: true,
    });

    // ✅ Create Private Subnet
    const privateSubnet = new ec2.PrivateSubnet(this, "PrivateSubnet", {
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: `${this.region}b`,
    });

    // ✅ Create Public Route Table
    const publicRouteTable = new ec2.CfnRouteTable(this, "PublicRouteTable", {
      vpcId: vpc.vpcId,
    });

    // ✅ Associate Public Subnet with Public Route Table
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "PublicSubnetRouteTableAssociation",
      {
        subnetId: publicSubnet.subnetId,
        routeTableId: publicRouteTable.ref,
      }
    );

    // ✅ Create Private Route Table
    const privateRouteTable = new ec2.CfnRouteTable(this, "PrivateRouteTable", {
      vpcId: vpc.vpcId,
    });

    // ✅ Associate Private Subnet with Private Route Table
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "PrivateSubnetRouteTableAssociation",
      {
        subnetId: privateSubnet.subnetId,
        routeTableId: privateRouteTable.ref,
      }
    );

    // ✅ Output Subnet IDs
    new cdk.CfnOutput(this, "PublicSubnetId", { value: publicSubnet.subnetId });
    new cdk.CfnOutput(this, "PrivateSubnetId", {
      value: privateSubnet.subnetId,
    });
  }
}
