export type MessageSender = 'user' | 'assistant' | 'system';

export interface CopilotCitation {
  title: string;
  source: string;
  timestamp?: string;
  metricValue?: string;
}

export interface CopilotMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  citations?: CopilotCitation[];
  suggestedActions?: {
    label: string;
    actionType: 'navigate' | 'override' | 'inspect';
    payload?: string;
  }[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  category: 'forecast' | 'dispatch' | 'curtailment' | 'revenue';
}
