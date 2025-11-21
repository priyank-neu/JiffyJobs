import prisma from '../config/database';
import { BidStatus as PrismaBidStatus, TaskStatus, NotificationType } from '@prisma/client';
import { BidStatus } from '../types';
import { createNotification } from './notification.service';
import { 
  Bid, 
  Contract, 
  CreateBidRequest, 
  WithdrawBidRequest, 
  AcceptBidRequest,
  CreateContractRequest,
  BidFilter,
  BidSortOptions
} from '../types';
import * as paymentService from './payment.service';

// Place a new bid on a task
export const placeBid = async (helperId: string, bidData: CreateBidRequest): Promise<Bid> => {
  const { taskId, amount, note } = bidData;

  // Validation
  if (amount <= 0) {
    throw new Error('Bid amount must be positive');
  }

  if (note && note.length > 500) {
    throw new Error('Bid note cannot exceed 500 characters');
  }

  // Check if task exists and is open
  const task = await prisma.task.findUnique({
    where: { taskId },
    include: { poster: true }
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.status !== TaskStatus.OPEN) {
    throw new Error('Task is not open for bidding');
  }

  // Check if helper is trying to bid on their own task
  if (task.posterId === helperId) {
    throw new Error('Cannot bid on your own task');
  }

  // Check if helper already has a pending bid on this task
  const existingBid = await prisma.bid.findUnique({
    where: {
      taskId_helperId: {
        taskId,
        helperId
      }
    }
  });

  if (existingBid && existingBid.status === PrismaBidStatus.PENDING) {
    throw new Error('You already have a pending bid on this task');
  }

  // Create the bid
  const bid = await prisma.bid.create({
    data: {
      taskId,
      helperId,
      amount,
      note,
      status: PrismaBidStatus.PENDING
    },
    include: {
      helper: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Create notification for the poster about new bid
  try {
    await createNotification({
      userId: task.posterId,
      type: NotificationType.OTHER, // Using OTHER since BID_PLACED is not in enum, but message is clear
      title: 'New Bid Received',
      message: `${bid.helper?.name || bid.helper?.email || 'Someone'} placed a bid of $${amount} on your task "${task.title}"`,
      relatedTaskId: taskId,
      relatedBidId: bid.bidId,
      sendEmail: true,
    });
  } catch (error) {
    // Notification failure shouldn't break bid creation
    console.error('Error creating notification for new bid:', error);
  }

  // Convert Decimal to number and null to undefined for response
  return {
    ...bid,
    amount: Number(bid.amount),
    note: bid.note ?? undefined,
    status: bid.status as BidStatus,
    helper: bid.helper ? {
      ...bid.helper,
      name: bid.helper.name ?? undefined
    } : undefined
  };
};

// Withdraw a pending bid
export const withdrawBid = async (helperId: string, withdrawData: WithdrawBidRequest): Promise<void> => {
  const { bidId } = withdrawData;

  const bid = await prisma.bid.findUnique({
    where: { bidId },
    include: { task: true }
  });

  if (!bid) {
    throw new Error('Bid not found');
  }

  // Check ownership
  if (bid.helperId !== helperId) {
    throw new Error('You can only withdraw your own bids');
  }

  // Check if bid is still pending
  if (bid.status !== PrismaBidStatus.PENDING) {
    throw new Error('Only pending bids can be withdrawn');
  }

  // Update bid status to withdrawn
  await prisma.bid.update({
    where: { bidId },
    data: { status: BidStatus.WITHDRAWN }
  });
};

// Accept a bid (poster only)
export const acceptBid = async (posterId: string, acceptData: AcceptBidRequest): Promise<Contract> => {
  const { bidId } = acceptData;

  const contractId = await prisma.$transaction(async (tx: any): Promise<string> => {
    // Get the bid with task information
    const bid = await tx.bid.findUnique({
      where: { bidId },
      include: {
        task: true,
        helper: {
          select: {
            userId: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!bid) {
      throw new Error('Bid not found');
    }

    // Check if poster owns the task
    if (bid.task.posterId !== posterId) {
      throw new Error('You can only accept bids on your own tasks');
    }

    // Check if bid is still pending
    if (bid.status !== PrismaBidStatus.PENDING) {
      throw new Error('Bid is no longer pending');
    }

    // Check if task is still open
    if (bid.task.status !== TaskStatus.OPEN) {
      throw new Error('Task is no longer open for bidding');
    }

    // Check if task already has a contract
    const existingContract = await tx.contract.findUnique({
      where: { taskId: bid.taskId }
    });

    if (existingContract) {
      throw new Error('Task already has an active contract');
    }

    // Accept the bid
    await tx.bid.update({
      where: { bidId },
      data: { status: PrismaBidStatus.ACCEPTED }
    });

    // Reject all other pending bids on this task
    await tx.bid.updateMany({
      where: {
        taskId: bid.taskId,
        bidId: { not: bidId },
        status: PrismaBidStatus.PENDING
      },
      data: { status: PrismaBidStatus.REJECTED }
    });

    // Update task status to ASSIGNED
    await tx.task.update({
      where: { taskId: bid.taskId },
      data: {
        status: TaskStatus.ASSIGNED,
        assignedHelperId: bid.helperId
      }
    });

    // Get poster info for payment
    const poster = await tx.user.findUnique({
      where: { userId: bid.task.posterId },
      select: { email: true }
    });

    // Create contract
    const contract = await tx.contract.create({
      data: {
        taskId: bid.taskId,
        helperId: bid.helperId,
        posterId: bid.task.posterId,
        agreedAmount: bid.amount,
        acceptedBidId: bidId
      },
      include: {
        helper: {
          select: {
            userId: true,
            name: true,
            email: true
          }
        },
        poster: {
          select: {
            userId: true,
            name: true,
            email: true
          }
        },
        acceptedBid: true
      }
    });

    // Create notifications for bid accepted and helper assigned
    try {
      // Notify helper that their bid was accepted
      await createNotification({
        userId: bid.helperId,
        type: NotificationType.BID_ACCEPTED,
        title: 'Bid Accepted!',
        message: `Your bid of $${Number(bid.amount)} has been accepted for "${bid.task.title}"`,
        relatedTaskId: bid.taskId,
        relatedBidId: bidId,
        sendEmail: true,
      });

      // Notify helper that they've been assigned
      await createNotification({
        userId: bid.helperId,
        type: NotificationType.HELPER_ASSIGNED,
        title: 'You\'ve Been Assigned',
        message: `You have been assigned to help with "${bid.task.title}"`,
        relatedTaskId: bid.taskId,
        sendEmail: true,
      });
    } catch (error) {
      // Notification failure shouldn't break bid acceptance
      console.error('Error creating notifications for bid acceptance:', error);
    }

    // Return contract ID - we'll fetch full contract after transaction
    return contract.contractId;
  });

  // After transaction commits, fetch the full contract and create payment intent
  const contract = await prisma.contract.findUnique({
    where: { contractId },
    include: {
      helper: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      poster: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      acceptedBid: true
    }
  });

  if (!contract) {
    throw new Error('Contract not found after creation');
  }

  let paymentInfo: { paymentIntentId: string; clientSecret: string } | null = null;
  
  // Get task title and poster email for payment
  const task = await prisma.task.findUnique({
    where: { taskId: contract.taskId },
    select: { title: true }
  });
  
  const poster = await prisma.user.findUnique({
    where: { userId: contract.posterId },
    select: { email: true }
  });

  if (poster) {
    try {
      paymentInfo = await paymentService.chargePoster(
        contract.contractId,
        Number(contract.agreedAmount),
        poster.email,
        `Payment for task: ${task?.title || 'Task'}`
      );
    } catch (paymentError) {
      // If payment creation fails, we need to handle it
      // For now, log the error but don't fail the bid acceptance
      // The contract is already created, payment can be retried
      console.error('Payment creation failed after contract creation:', paymentError);
      // Optionally, you could mark the contract as payment_failed or delete it
    }
  }

  // Convert Decimal to number and null to undefined for response
  const contractResponse = {
    ...contract,
    agreedAmount: Number(contract.agreedAmount),
    startDate: contract.startDate ?? undefined,
    endDate: contract.endDate ?? undefined,
    terms: contract.terms ?? undefined,
    helper: contract.helper ? {
      ...contract.helper,
      name: contract.helper.name ?? undefined
    } : undefined,
    poster: contract.poster ? {
      ...contract.poster,
      name: contract.poster.name ?? undefined
    } : undefined,
    acceptedBid: contract.acceptedBid ? {
      ...contract.acceptedBid,
      amount: Number(contract.acceptedBid.amount),
      note: contract.acceptedBid.note ?? undefined,
      status: contract.acceptedBid.status as BidStatus
    } : undefined
  };

  // Add payment info if available
  const result: Contract & { paymentInfo?: { paymentIntentId: string; clientSecret: string } } = {
    ...contractResponse,
  };

  if (paymentInfo !== null) {
    result.paymentInfo = {
      paymentIntentId: paymentInfo!.paymentIntentId,
      clientSecret: paymentInfo!.clientSecret,
    };
  }

  return result;
};

// Get bids for a task with proper visibility rules
export const getTaskBids = async (
  userId: string, 
  taskId: string, 
  filter?: BidFilter,
  sort?: BidSortOptions
): Promise<Bid[]> => {
  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { taskId },
    select: { posterId: true }
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Determine visibility rules
  const isPoster = task.posterId === userId;
  
  let whereClause: any = { taskId };
  
  if (!isPoster) {
    // Helper can only see their own bids
    whereClause.helperId = userId;
  }

  // Apply filters
  if (filter?.status) {
    whereClause.status = filter.status;
  }

  // Apply sorting
  let orderBy: any = { createdAt: 'desc' }; // Default sort by newest first
  
  if (sort) {
    switch (sort.field) {
      case 'amount':
        orderBy = { amount: sort.order };
        break;
      case 'createdAt':
        orderBy = { createdAt: sort.order };
        break;
      case 'helperName':
        orderBy = { helper: { name: sort.order } };
        break;
    }
  }

  const bids = await prisma.bid.findMany({
    where: whereClause,
    orderBy,
    include: {
      helper: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Convert Decimal to number and null to undefined for response
  return bids.map((bid: any) => ({
    ...bid,
    amount: Number(bid.amount),
    note: bid.note ?? undefined,
    status: bid.status as BidStatus,
    helper: bid.helper ? {
      ...bid.helper,
      name: bid.helper.name ?? undefined
    } : undefined
  }));
};

// Get helper's bids
export const getHelperBids = async (
  helperId: string,
  filter?: BidFilter,
  sort?: BidSortOptions
): Promise<Bid[]> => {
  let whereClause: any = { helperId };
  
  // Apply filters
  if (filter?.status) {
    whereClause.status = filter.status;
  }
  
  if (filter?.taskId) {
    whereClause.taskId = filter.taskId;
  }

  // Apply sorting
  let orderBy: any = { createdAt: 'desc' };
  
  if (sort) {
    switch (sort.field) {
      case 'amount':
        orderBy = { amount: sort.order };
        break;
      case 'createdAt':
        orderBy = { createdAt: sort.order };
        break;
      case 'helperName':
        orderBy = { helper: { name: sort.order } };
        break;
    }
  }

  const bids = await prisma.bid.findMany({
    where: whereClause,
    orderBy,
    include: {
      helper: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      task: {
        select: {
          taskId: true,
          title: true,
          status: true,
          poster: {
            select: {
              userId: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  // Convert Decimal to number and null to undefined for response
  return bids.map((bid: any) => ({
    ...bid,
    amount: Number(bid.amount),
    note: bid.note ?? undefined,
    status: bid.status as BidStatus,
    helper: bid.helper ? {
      ...bid.helper,
      name: bid.helper.name ?? undefined
    } : undefined
  }));
};

// Get contract by task ID
export const getTaskContract = async (taskId: string): Promise<Contract | null> => {
  const contract = await prisma.contract.findUnique({
    where: { taskId },
    include: {
      helper: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      poster: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      acceptedBid: true
    }
  });

  if (!contract) return null;

  // Convert Decimal to number and null to undefined for response
  return {
    ...contract,
    agreedAmount: Number(contract.agreedAmount),
    startDate: contract.startDate ?? undefined,
    endDate: contract.endDate ?? undefined,
    terms: contract.terms ?? undefined,
    helper: contract.helper ? {
      ...contract.helper,
      name: contract.helper.name ?? undefined
    } : undefined,
    poster: contract.poster ? {
      ...contract.poster,
      name: contract.poster.name ?? undefined
    } : undefined,
    acceptedBid: contract.acceptedBid ? {
      ...contract.acceptedBid,
      amount: Number(contract.acceptedBid.amount),
      note: contract.acceptedBid.note ?? undefined,
      status: contract.acceptedBid.status as BidStatus
    } : undefined
  };
};

// Get contract by ID
export const getContract = async (contractId: string): Promise<Contract | null> => {
  const contract = await prisma.contract.findUnique({
    where: { contractId },
    include: {
      helper: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      poster: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      acceptedBid: true
    }
  });

  if (!contract) return null;

  // Convert Decimal to number and null to undefined for response
  return {
    ...contract,
    agreedAmount: Number(contract.agreedAmount),
    startDate: contract.startDate ?? undefined,
    endDate: contract.endDate ?? undefined,
    terms: contract.terms ?? undefined,
    helper: contract.helper ? {
      ...contract.helper,
      name: contract.helper.name ?? undefined
    } : undefined,
    poster: contract.poster ? {
      ...contract.poster,
      name: contract.poster.name ?? undefined
    } : undefined,
    acceptedBid: contract.acceptedBid ? {
      ...contract.acceptedBid,
      amount: Number(contract.acceptedBid.amount),
      note: contract.acceptedBid.note ?? undefined,
      status: contract.acceptedBid.status as BidStatus
    } : undefined
  };
};

// Update contract terms
export const updateContract = async (
  contractId: string,
  updates: {
    startDate?: Date;
    endDate?: Date;
    terms?: string;
  }
): Promise<Contract> => {
  const contract = await prisma.contract.update({
    where: { contractId },
    data: updates,
    include: {
      helper: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      poster: {
        select: {
          userId: true,
          name: true,
          email: true
        }
      },
      acceptedBid: true
    }
  });

  // Convert Decimal to number and null to undefined for response
  return {
    ...contract,
    agreedAmount: Number(contract.agreedAmount),
    startDate: contract.startDate ?? undefined,
    endDate: contract.endDate ?? undefined,
    terms: contract.terms ?? undefined,
    helper: contract.helper ? {
      ...contract.helper,
      name: contract.helper.name ?? undefined
    } : undefined,
    poster: contract.poster ? {
      ...contract.poster,
      name: contract.poster.name ?? undefined
    } : undefined,
    acceptedBid: contract.acceptedBid ? {
      ...contract.acceptedBid,
      amount: Number(contract.acceptedBid.amount),
      note: contract.acceptedBid.note ?? undefined,
      status: contract.acceptedBid.status as BidStatus
    } : undefined
  };
};

// Deactivate contract
export const deactivateContract = async (contractId: string): Promise<void> => {
  await prisma.contract.update({
    where: { contractId },
    data: { isActive: false }
  });
};
