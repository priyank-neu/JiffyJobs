export interface ChatThread {
  threadId: string;
  taskId: string;
  posterId: string;
  helperId: string;
  createdAt: string;
  updatedAt: string;
  task?: {
    taskId: string;
    title: string;
    status: string;
  };
  poster?: {
    userId: string;
    name?: string;
    email: string;
  };
  helper?: {
    userId: string;
    name?: string;
    email: string;
  };
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
}

export interface ChatMessage {
  messageId: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  body: string;
  readAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  sender?: {
    userId: string;
    name?: string;
    email: string;
  };
  receiver?: {
    userId: string;
    name?: string;
    email: string;
  };
}

export interface CreateThreadRequest {
  taskId: string;
  helperId: string;
}

export interface SendMessageRequest {
  threadId: string;
  body: string;
}

export interface ThreadMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}


