import React, { useState } from 'react';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';
import { Remarkable } from 'remarkable';
import { linkify } from 'remarkable/linkify';
import externalLink from 'remarkable-external-link';

import {
	IconButton,
	Divider,
	FlexDivColCentered,
	ModalContent,
	ModalItem,
	ModalItemText,
	ModalItemTitle,
} from 'styles/common';

import NavigationBack from 'assets/svg/app/navigation-back.svg';
import PendingConfirmation from 'assets/svg/app/pending-confirmation.svg';
import Success from 'assets/svg/app/success.svg';

import {
	InputContainer,
	Container,
	HeaderRow,
	Header,
	StyledCTA,
	StyledTooltip,
	GreyHeader,
	DismissButton,
	ButtonSpacer,
	WhiteSubheader,
} from 'sections/gov/components/common';

import { truncateAddress } from 'utils/formatters/string';
import { useTranslation } from 'react-i18next';
import useSignMessage, { SignatureType } from 'mutations/gov/useSignMessage';
import useActiveTab from 'sections/gov/hooks/useActiveTab';
import { useRecoilValue } from 'recoil';
import { proposalState } from 'store/gov';
import Button from 'components/Button';

import { Transaction } from 'constants/network';
import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';
import TxState from 'sections/gov/components/TxState';

type ContentProps = {
	onBack: Function;
};

const Content: React.FC<ContentProps> = ({ onBack }) => {
	const { t } = useTranslation();

	const [voteMutate] = useSignMessage();
	const activeTab = useActiveTab();
	const [selected, setSelected] = useState<number | null>(null);

	const [error, setError] = useState<string | null>(null);
	const [txModalOpen, setTxModalOpen] = useState<boolean>(false);

	const [transactionState, setTransactionState] = useState<Transaction>(Transaction.PRESUBMIT);

	const proposal = useRecoilValue(proposalState);

	const handleVote = async (hash?: string | null) => {
		if (hash && selected !== null) {
			setTransactionState(Transaction.WAITING);
			voteMutate({
				spaceKey: activeTab,
				type: SignatureType.VOTE,
				payload: { proposal: hash, choice: selected + 1, metadata: {} },
			})
				.then((response) => {
					setTransactionState(Transaction.SUCCESS);

					console.log(response);
				})
				.catch((error) => {
					console.log(error);
					setTransactionState(Transaction.PRESUBMIT);

					setError(error);
				});
		}
	};

	const expired = (timestamp?: number) => {
		if (!timestamp) return;
		if (Date.now() / 1000 > timestamp) {
			return true;
		} else {
			return false;
		}
	};

	const getRawMarkup = (value?: string | null) => {
		const remarkable = new Remarkable({
			html: false,
			breaks: true,
			typographer: false,
		})
			.use(linkify)
			.use(externalLink);

		if (!value) return { __html: '' };

		return { __html: remarkable.render(value) };
	};

	if (transactionState === Transaction.WAITING) {
		return (
			<TxState
				title={t('gov.actions.vote.waiting')}
				content={
					<FlexDivColCentered>
						<Svg src={PendingConfirmation} />
						<GreyHeader>{t('gov.actions.vote.signing')}</GreyHeader>
						<WhiteSubheader>
							{t('gov.actions.vote.hash', {
								hash: truncateAddress(proposal?.authorIpfsHash ?? ''),
							})}
						</WhiteSubheader>
					</FlexDivColCentered>
				}
			/>
		);
	}

	if (transactionState === Transaction.SUCCESS) {
		return (
			<TxState
				title={t('gov.actions.vote.success')}
				content={
					<FlexDivColCentered>
						<Svg src={Success} />
						<GreyHeader>{t('gov.actions.vote.signing')}</GreyHeader>
						<WhiteSubheader>
							{t('gov.actions.vote.hash', {
								hash: truncateAddress(proposal?.authorIpfsHash ?? ''),
							})}
						</WhiteSubheader>
						<Divider />
						<ButtonSpacer>
							<DismissButton
								variant="secondary"
								onClick={() => {
									setTransactionState(Transaction.PRESUBMIT);
								}}
							>
								{t('earn.actions.tx.dismiss')}
							</DismissButton>
						</ButtonSpacer>
					</FlexDivColCentered>
				}
			/>
		);
	}

	return (
		<>
			<Container>
				<InputContainer>
					<HeaderRow>
						<IconButton onClick={() => onBack(null)}>
							<Svg src={NavigationBack} />
						</IconButton>
						<Header>#{truncateAddress(proposal?.authorIpfsHash ?? '')}</Header>
						<Status active={!expired(proposal?.msg.payload.end)}>
							{expired(proposal?.msg.payload.end)
								? t('gov.proposal.status.closed')
								: t('gov.proposal.status.open')}
						</Status>
					</HeaderRow>
					<ProposalContainer>
						<Title>{proposal?.msg.payload.name}</Title>
						<Description dangerouslySetInnerHTML={getRawMarkup(proposal?.msg.payload.body)} />
					</ProposalContainer>
					<Divider />
					{!expired(proposal?.msg.payload.end) && (
						<OptionsContainer>
							{proposal?.msg.payload.choices.map((choice, i) => (
								<StyledTooltip arrow={true} placement="bottom" content={choice} hideOnClick={false}>
									<Option
										selected={selected === i}
										onClick={() => setSelected(i)}
										variant="text"
										key={i}
									>
										<p>{choice}</p>
									</Option>
								</StyledTooltip>
							))}
						</OptionsContainer>
					)}
				</InputContainer>
				<StyledCTA onClick={() => handleVote(proposal?.authorIpfsHash)} variant="primary">
					{t('gov.proposal.action.vote')}
				</StyledCTA>
			</Container>
			{txModalOpen && (
				<TxConfirmationModal
					isSignature={true}
					onDismiss={() => setTxModalOpen(false)}
					txError={error}
					attemptRetry={handleVote}
					content={
						<ModalContent>
							<ModalItem>
								<ModalItemTitle>{t('modals.confirm-signature.vote.title')}</ModalItemTitle>
								<ModalItemText>
									{t('modals.confirm-signature.vote.hash', {
										hash: truncateAddress(proposal?.authorIpfsHash ?? ''),
									})}
								</ModalItemText>
							</ModalItem>
						</ModalContent>
					}
				/>
			)}
		</>
	);
};
export default Content;

const Status = styled.p<{ active: boolean }>`
	color: ${(props) => (props.active ? props.theme.colors.green : props.theme.colors.gray)};
	text-transform: uppercase;
	font-family: ${(props) => props.theme.fonts.extended};
	font-size: 14px;
`;

const ProposalContainer = styled(FlexDivColCentered)`
	min-height: 400px;
`;

const Title = styled.p`
	font-family: ${(props) => props.theme.fonts.extended};
	font-size: 14px;
	text-align: center;
`;

const Description = styled.div`
	max-height: 300px;
	overflow-y: auto;
	font-size: 14px;
	text-align: center;
	font-family: ${(props) => props.theme.fonts.regular};
	margin: 16px 8px;

	width: 500px;

	h1 {
		font-size: 14px;
	}

	h2 {
		font-size: 14px;
	}

	h3 {
		font-size: 14px;
	}

	h4 {
		font-size: 14px;
	}

	h5 {
		font-size: 14px;
	}

	h6 {
		font-size: 14px;
	}

	a {
		color: ${(props) => props.theme.colors.blue};
		font-family: ${(props) => props.theme.fonts.interBold};
		text-decoration: none;
		font-size: 14px;
	}
`;

const OptionsContainer = styled.div`
	max-height: 200px;
	overflow-y: auto;
	width: 500px;
	display: grid;
	grid-template-columns: auto auto;
	column-gap: 8px;
	row-gap: 8px;
	padding-top: 16px;
`;

const Option = styled(Button)<{ selected: boolean }>`
	background-color: ${(props) =>
		props.selected ? props.theme.colors.mediumBlue : props.theme.colors.navy};
	color: ${(props) => (props.selected ? props.theme.colors.blue : props.theme.colors.white)};
	font-size: 12px;
	font-family: ${(props) => props.theme.fonts.interBold};
	text-transform: uppercase;
	text-align: center;
	align-items: center;

	width: 235px;

	p {
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		padding: 0px 16px;
		margin: 0;
	}

	:hover {
		background-color: ${(props) => props.theme.colors.mediumBlue};
		transition: background-color 0.25s;
	}
`;

const ActionContainer = styled.div``;
