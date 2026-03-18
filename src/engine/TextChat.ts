// 29. Text chat dengan filter, slow-mode, report, rate limit
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  filtered: boolean;
}

export class TextChat {
  private messages: ChatMessage[] = [];
  private maxMessages = 100;
  private rateLimitMap = new Map<string, number[]>();
  private rateLimitWindow = 10000; // 10 seconds
  private rateLimitMax = 5;
  private slowMode = false;
  private slowModeDelay = 3000; // 3 seconds
  private lastMessageTime = new Map<string, number>();
  private bannedWords = new Set<string>(['spam', 'abuse']);
  private reportedUsers = new Map<string, number>();

  setSlowMode(enabled: boolean, delay = 3000): void {
    this.slowMode = enabled;
    this.slowModeDelay = delay;
  }

  addBannedWord(word: string): void {
    this.bannedWords.add(word.toLowerCase());
  }

  sendMessage(userId: string, username: string, content: string): ChatMessage | null {
    // Rate limit check
    if (!this.checkRateLimit(userId)) {
      console.warn('Rate limit exceeded');
      return null;
    }

    // Slow mode check
    if (this.slowMode) {
      const lastTime = this.lastMessageTime.get(userId) || 0;
      if (Date.now() - lastTime < this.slowModeDelay) {
        console.warn('Slow mode active');
        return null;
      }
    }

    // Filter content
    const filtered = this.filterContent(content);

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      username,
      content: filtered.content,
      timestamp: Date.now(),
      filtered: filtered.wasFiltered
    };

    this.messages.push(message);
    this.lastMessageTime.set(userId, Date.now());

    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    return message;
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(userId) || [];
    
    const recentTimestamps = timestamps.filter(t => now - t < this.rateLimitWindow);
    
    if (recentTimestamps.length >= this.rateLimitMax) {
      return false;
    }

    recentTimestamps.push(now);
    this.rateLimitMap.set(userId, recentTimestamps);
    return true;
  }

  private filterContent(content: string): { content: string; wasFiltered: boolean } {
    let filtered = content;
    let wasFiltered = false;

    for (const word of this.bannedWords) {
      const regex = new RegExp(word, 'gi');
      if (regex.test(filtered)) {
        filtered = filtered.replace(regex, '*'.repeat(word.length));
        wasFiltered = true;
      }
    }

    return { content: filtered, wasFiltered };
  }

  reportUser(reporterId: string, reportedUserId: string): void {
    const count = this.reportedUsers.get(reportedUserId) || 0;
    this.reportedUsers.set(reportedUserId, count + 1);
  }

  getReportCount(userId: string): number {
    return this.reportedUsers.get(userId) || 0;
  }

  getMessages(limit = 50): ChatMessage[] {
    return this.messages.slice(-limit);
  }

  clearMessages(): void {
    this.messages = [];
  }
}
