import { ChatAssistant } from '@/components/dashboard/chat-assistant';

export default function AssistantPage() {
  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-primary md:text-4xl">
          Family Assistant & Counselor
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Ask me about genealogy, family history, or get counseling support for family matters.
        </p>
      </div>
      <ChatAssistant />
    </div>
  );
}
