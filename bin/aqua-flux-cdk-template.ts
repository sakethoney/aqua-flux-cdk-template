#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AquaFluxCdkTemplateStack } from '../lib/aqua-flux-cdk-template-stack';
import { AquaFluxSubnetStack } from '../lib/aqua-flux-cdk-subnet-stack';
import { AquaFluxInternetGatewayStack } from '../lib/aqua-flux-cdk-internet-gateway-stack';
import { AquaNatGatewayStack } from '../lib/aqua-flux-cdk-nat-gateway-stack';
import { AquaEcsClusterStack } from '../lib/aqua-flux-cdk-ecs-cluster-stack';


const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
new AquaFluxCdkTemplateStack(app, 'AquaFluxCdkTemplateStack', {env});
new AquaFluxSubnetStack(app,'AquaFluxSubnetStack',{env});
new AquaFluxInternetGatewayStack(app,'AquaFluxInternetGatewayStack', {env});
new AquaNatGatewayStack(app,'AquaNatGatewayStack',{env});
new AquaEcsClusterStack(app,'AquaEcsClusterStack', {env});