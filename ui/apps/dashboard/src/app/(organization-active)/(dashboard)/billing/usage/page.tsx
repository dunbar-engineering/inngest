'use client';

import { useQuery } from 'urql';

import { graphql } from '@/gql';
import type { BillingPlan } from '@/gql/graphql';
import LoadingIcon from '@/icons/LoadingIcon';
import { BillableStepUsage } from '../../settings/billing/BillableStepUsage/BillableStepUsage';
import BillingPlanSelector from '../../settings/billing/BillingPlanSelector';
import CurrentSubscription from '../../settings/billing/CurrentSubscription';
import { isEnterprisePlan, transformPlan } from '../../settings/billing/utils';

// This will move to the API as a custom plan at some point, for now we can hard code
const ENTERPRISE_PLAN: BillingPlan = {
  id: 'n/a',
  name: 'Enterprise',
  amount: Infinity,
  billingPeriod: 'month',
  features: {
    actions: '10m+',
    concurrency: 'Custom',
    log_retention: 90,
    users: '20+',
    workflows: 'Custom',
  },
};

const GetBillingInfoDocument = graphql(`
  query GetBillingInfo {
    account {
      billingEmail
      name
      plan {
        id
        name
        amount
        billingPeriod
        features
      }
      subscription {
        nextInvoiceDate
      }

      paymentMethods {
        brand
        last4
        expMonth
        expYear
        createdAt
        default
      }
    }

    plans {
      id
      name
      amount
      billingPeriod
      features
    }
  }
`);

export default function Billing() {
  const [{ data, fetching }, refetch] = useQuery({
    query: GetBillingInfoDocument,
  });

  if (!data || fetching) {
    return (
      <div className="flex h-full min-h-[297px] w-full items-center justify-center overflow-hidden">
        <LoadingIcon />
      </div>
    );
  }

  const currentPlan = data.account.plan || undefined;
  const basePlans = [...data.plans, ENTERPRISE_PLAN];
  const subscription = data.account.subscription;

  let includedStepCountLimit: number | undefined;
  if (typeof data.account.plan?.features.actions === 'number') {
    includedStepCountLimit = data.account.plan.features.actions;
  }

  // TODO = remove this from the transform plan and components, it's unused in the UI
  const totalStepCount = 0;

  // Always sort enterprise plans (including trials) last no matter the amount
  const plans = basePlans
    .map((plan) => (plan ? transformPlan({ plan, currentPlan, usage: totalStepCount }) : null))
    .sort((a, b) => (a?.isPremium ? 1 : (a?.amount || 0) - (b?.amount || 0)));
  const isCurrentPlanEnterprise = currentPlan != undefined && isEnterprisePlan(currentPlan);
  const freePlan = plans.find((p) => p?.isFreeTier);

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <CurrentSubscription
          subscription={subscription || undefined}
          currentPlan={currentPlan || undefined}
          isCurrentPlanEnterprise={isCurrentPlanEnterprise}
          freePlan={freePlan || undefined}
        />
        <div className="col-span-3 pl-6">
          <BillableStepUsage includedStepCountLimit={includedStepCountLimit} />
        </div>
      </div>

      <BillingPlanSelector
        plans={plans}
        isCurrentPlanEnterprise={isCurrentPlanEnterprise}
        onUpdate={() => refetch()}
      />
    </>
  );
}
