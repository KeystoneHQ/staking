import { useQuery, UseQueryOptions } from 'react-query';
import { useRecoilValue } from 'recoil';
import Wei, { wei } from '@synthetixio/wei';

import synthetix from 'lib/synthetix';

import QUERY_KEYS from 'constants/queryKeys';

import { appReadyState } from 'store/app';

export type FeePoolData = {
	feePeriodDuration: number;
	startTime: number;
	feesToDistribute: number;
	feesClaimed: number;
	rewardsToDistribute: number;
	rewardsToDistributeBN: Wei;
	rewardsClaimed: number;
};

const useGetFeePoolDataQuery = (period: string, options?: UseQueryOptions<FeePoolData>) => {
	const isAppReady = useRecoilValue(appReadyState);

	return useQuery<FeePoolData>(
		QUERY_KEYS.Staking.FeePoolData(period),
		async () => {
			const {
				contracts: { FeePool },
				utils: { formatEther },
			} = synthetix.js!;
			const feePeriod = await FeePool.recentFeePeriods(period);
			const feePeriodDuration = await FeePool.feePeriodDuration();
			return {
				feePeriodDuration: Number(feePeriodDuration),
				startTime: Number(feePeriod.startTime) || 0,
				feesToDistribute: Number(formatEther(feePeriod.feesToDistribute)) || 0,
				feesClaimed: Number(formatEther(feePeriod.feesClaimed)) || 0,
				rewardsToDistribute: Number(formatEther(feePeriod.rewardsToDistribute)) || 0,
				rewardsToDistributeBN: wei(formatEther(feePeriod.rewardsToDistribute)),
				rewardsClaimed: Number(formatEther(feePeriod.rewardsClaimed)) || 0,
			};
		},
		{
			enabled: isAppReady && !!period,
			...options,
		}
	);
};

export default useGetFeePoolDataQuery;
