import { AppError, ErrorType } from '@/types/file-system';
import { ErrorHandler } from './ErrorHandler';

/**
 * Transaction operation interface
 */
interface TransactionOperation {
  execute: () => Promise<any>;
  rollback: () => Promise<any>;
  description: string;
}

/**
 * Transaction class for atomic operations
 */
export class Transaction {
  private operations: TransactionOperation[] = [];
  private completedOperations: number = 0;

  /**
   * Add an operation to the transaction
   * @param execute Execute function
   * @param rollback Rollback function
   * @param description Operation description
   */
  addOperation(
    execute: () => Promise<any>,
    rollback: () => Promise<any>,
    description: string
  ): void {
    this.operations.push({ execute, rollback, description });
  }

  /**
   * Execute the transaction
   */
  async execute(): Promise<boolean> {
    try {
      for (let i = 0; i < this.operations.length; i++) {
        const operation = this.operations[i];
        console.log(`Executing operation: ${operation.description}`);
        await operation.execute();
        this.completedOperations = i + 1;
      }
      console.log('Transaction completed successfully');
      return true;
    } catch (error) {
      console.error('Transaction failed, rolling back...', error);
      await this.rollback();
      throw error;
    }
  }

  /**
   * Rollback the transaction
   */
  private async rollback(): Promise<void> {
    for (let i = this.completedOperations - 1; i >= 0; i--) {
      const operation = this.operations[i];
      try {
        console.log(`Rolling back operation: ${operation.description}`);
        await operation.rollback();
      } catch (rollbackError) {
        console.error(`Failed to rollback operation ${i}: ${operation.description}`, rollbackError);
        // Continue rolling back other operations
      }
    }
    this.completedOperations = 0;
  }

  /**
   * Get the number of operations in the transaction
   */
  getOperationCount(): number {
    return this.operations.length;
  }

  /**
   * Check if the transaction is empty
   */
  isEmpty(): boolean {
    return this.operations.length === 0;
  }
}

/**
 * Transaction manager class
 */
export class TransactionManager {
  /**
   * Create a new transaction
   */
  static createTransaction(): Transaction {
    return new Transaction();
  }

  /**
   * Execute a transaction with retry mechanism
   * @param transaction Transaction to execute
   * @param maxRetries Maximum number of retries
   * @param retryDelay Delay between retries (ms)
   */
  static async executeWithRetry(
    transaction: Transaction,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<boolean> {
    if (transaction.isEmpty()) {
      throw new Error('Transaction is empty');
    }

    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Transaction attempt ${attempt + 1}/${maxRetries}`);
        const success = await transaction.execute();
        return success;
      } catch (error) {
        lastError = error;
        console.warn(`Transaction attempt ${attempt + 1} failed, retrying...`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError || new Error('Transaction failed after multiple attempts');
  }

  /**
   * Execute a simple transaction with two operations
   * @param operation1 First operation
   * @param operation2 Second operation
   * @param rollback1 Rollback for first operation
   * @param rollback2 Rollback for second operation
   */
  static async executeSimpleTransaction(
    operation1: () => Promise<any>,
    operation2: () => Promise<any>,
    rollback1: () => Promise<any>,
    rollback2: () => Promise<any>
  ): Promise<boolean> {
    const transaction = this.createTransaction();
    transaction.addOperation(operation1, rollback1, 'Operation 1');
    transaction.addOperation(operation2, rollback2, 'Operation 2');
    return await this.executeWithRetry(transaction);
  }
}
