import Web3 from 'web3';
import { transactionsService, accountService, blockService } from '../services';
import { Request, Response, NextFunction } from 'express';

export const searchData = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let response;
    const queryData: any = {};
    const type = req.query.type;
    const page = parseInt(req.query.page as any);
    const limit = parseInt(req.query.limit as any);

    // If there is any filter in query
    if (req.query.fromNetwork) {
      queryData.networkId = req.query.fromNetwork;
    }
    if (req.query.toNetwork) {
      queryData.remoteNetworkId = req.query.toNetwork;
    }
    if (req.query.fromDate && req.query.toDate) {
      queryData.$and = [
        { timestamp: { $gte: req.query.fromDate } },
        { timestamp: { $lte: req.query.toDate } },
      ];
    } else if (req.query.fromDate) {
      queryData.timestamp = req.query.fromDate;
    } else if (req.query.toDate) {
      queryData.timestamp = req.query.toDate;
    }

    // ==> First Case: only data + no filters + no type
    if (req.query.data && !Object.keys(queryData).length && !type) {
      if (Web3.utils.isAddress(req.query.data as string)) {
        response = await accountService.getAccount(req.query.data as string);
      } else {
        response = await transactionsService.getTransaction(
          req.query.data as string,
        );
        if (!response) {
          response = await blockService.getBlockByBlockHash(
            req.query.data as string,
          );
        }
      }
    }

    // ==> 2nd Case: Data + noFilters + type
    else if (req.query.data && !Object.keys(queryData).length && type) {
      if (type === 'transactions') {
        response = await transactionsService.getTransaction(
          req.query.data as string,
        );
      } else if (type === 'blocks') {
        response = await blockService.getBlockByBlockHash(
          req.query.data as string,
        );
      }
    }

    // ==> 3rd Case: Data + filters + type
    else if (req.query.data && Object.keys(queryData).length && type) {
      if (type === 'transactions') {
        queryData.hash = req.query.data;
        response = await transactionsService.getTransactionByQuery(queryData);
      } else if (type === 'blocks') {
        queryData.blockHash = req.query.data;
        response = await blockService.getBlockByQuery(queryData);
      }
    }

    // ==> 4th Case: Data + Filters + noType
    else if (req.query.data && Object.keys(queryData).length && !type) {
      if (Web3.utils.isAddress(req.query.data as string)) {
        response = await accountService.getAccount(req.query.data as string);
      } else {
        response = await transactionsService.getTransactionByQuery(queryData);
        if (!response) {
          response = await blockService.getBlockByQuery(queryData);
        }
      }
    }

    // 5th Case: no data + (if) filters + type
    else if (!req.query.data && type) {
      if (type === 'transactions') {
        response = await transactionsService.getAllTransactions(
          page,
          limit,
          queryData,
        );
      } else if (type === 'blocks') {
        response = await blockService.getAllBlocks(page, limit, queryData);
      }
    }
    res.send({ response });
  } catch (error) {
    next(error);
  }
};
