import { useQuery, UseQueryOptions } from 'react-query';
import { useRecoilValue } from 'recoil';
import Wei from '@synthetixio/wei';

import synthetix from 'lib/synthetix';

import QUERY_KEYS from 'constants/queryKeys';

import { isWalletConnectedState, networkState, walletAddressState } from 'store/wallet';
import { appReadyState } from 'store/app';
import { wei } from '../../../js-monorepo/packages/queries/node_modules/@synthetixio/wei/build/node/wei';

type WalletDebtData = {
	targetCRatio: Wei;
	currentCRatio: Wei;
	transferable: Wei;
	debtBalance: Wei;
	collateral: Wei;
	issuableSynths: Wei;
	balance: Wei;
	totalSupply: Wei;
};

const useGetDebtDataQuery = (options?: UseQueryOptions<WalletDebtData>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const network = useRecoilValue(networkState);

	return useQuery<WalletDebtData>(
		QUERY_KEYS.Debt.WalletDebtData(walletAddress ?? '', network?.id!),
		async () => {
			const {
				contracts: { SystemSettings, Synthetix },
				utils,
			} = synthetix.js!;
			const sUSDBytes = utils.formatBytes32String('sUSD');
			const result = await Promise.all([
				SystemSettings.issuanceRatio(),
				Synthetix.collateralisationRatio(walletAddress),
				Synthetix.transferableSynthetix(walletAddress),
				Synthetix.debtBalanceOf(walletAddress, sUSDBytes),
				Synthetix.collateral(walletAddress),
				Synthetix.maxIssuableSynths(walletAddress),
				Synthetix.balanceOf(walletAddress),
				Synthetix.totalSupply(),
			]);
			const [
				targetCRatio,
				currentCRatio,
				transferable,
				debtBalance,
				collateral,
				issuableSynths,
				balance,
				totalSupply,
			] = result.map((item) => wei(utils.formatEther(item)));
			return {
				targetCRatio,
				currentCRatio,
				transferable,
				debtBalance,
				collateral,
				issuableSynths,
				balance,
				totalSupply,
			};
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useGetDebtDataQuery;
