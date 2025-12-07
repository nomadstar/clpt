export interface BlockchainTransferEvent {
  txHash: string;
  from: string;
  to: string;
  amount: string; // decimal/minor units as string
  paymentIntentId?: string;
}

export interface BlockchainClient {
  // placeholder to be implemented later
  startListening?: () => Promise<void>;
}

export const createStubClient = (): BlockchainClient => ({
  startListening: async () => {
    // no-op for now
  }
});
