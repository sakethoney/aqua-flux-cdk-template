#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PrivateProductFargateEcsStack } from '../lib/aqua-flux-ecs-cluster-create-deploy-stack';
import { AddPrivateSubnetStack } from '../lib/aqua-flux-additional-subnet-az';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
new PrivateProductFargateEcsStack(app, 'PrivateProductFargateEcsStack', {env});
//new AddPrivateSubnetStack(app,'AddPrivateSubnetStack',{env});