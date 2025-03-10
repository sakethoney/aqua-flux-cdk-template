import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class AddPrivateSubnetStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Replace with your existing VPC ID
        const vpcId = 'vpc-xxxxxxxxx';

        // Existing NAT Gateway (replace with actual ID)
        const existingNatGatewayId = 'nat-yyyyyyyyyyyyyyy'; // Your NAT Gateway ID

        // Import the existing VPC
        const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
            vpcId: vpcId,
        });

        // Choose a non-overlapping CIDR block for the new private subnet
        const newPrivateSubnetCidr = '10.0.3.0/24'; // Ensure this doesn’t overlap with existing subnets

        // Define a new private subnet in a different AZ
        const newPrivateSubnet = new ec2.CfnSubnet(this, 'PrivateSubnet02', {
            vpcId: vpc.vpcId,
            cidrBlock: newPrivateSubnetCidr,
            availabilityZone: 'us-east-1a', // Ensure different from existing private subnets
            mapPublicIpOnLaunch: false,
            tags: [{ key: 'Name', value: 'PrivateSubnet02' }],
        });

        // Create a new private Route Table
        const newPrivateRouteTable = new ec2.CfnRouteTable(this, 'PrivateRouteTable02', {
            vpcId: vpc.vpcId,
            tags: [{ key: 'Name', value: 'PrivateRouteTable02' }],
        });

        // Add a route to the NAT Gateway for outbound internet access
        new ec2.CfnRoute(this, 'NatGatewayRoute02', {
            routeTableId: newPrivateRouteTable.ref,
            destinationCidrBlock: '0.0.0.0/0', // Route all internet traffic to the NAT Gateway
            natGatewayId: existingNatGatewayId,
        });

        // Associate the new private subnet with the new private route table
        new ec2.CfnSubnetRouteTableAssociation(this, 'SubnetRouteTableAssociation02', {
            subnetId: newPrivateSubnet.ref,
            routeTableId: newPrivateRouteTable.ref,
        });

        // Output the new subnet ID
        new cdk.CfnOutput(this, 'NewPrivateSubnetId', {
            value: newPrivateSubnet.ref,
            description: 'The ID of the newly created private subnet',
        });

        // Output the new route table ID
        new cdk.CfnOutput(this, 'NewPrivateRouteTableId', {
            value: newPrivateRouteTable.ref,
            description: 'The ID of the new private route table',
        });
    }
}
