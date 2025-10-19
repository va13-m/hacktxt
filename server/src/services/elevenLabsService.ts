// server/src/services/elevenLabsService.ts
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;
  private audioCache: Map<string, string>;
  private cacheDir: string;

  constructor() {
    this.apiKey = process.env.ELEVEN_LABS_KEY || '';
    this.voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella - warm, friendly voice
    this.audioCache = new Map();
    this.cacheDir = path.join(__dirname, '../../audio_cache');
    
    // Create audio cache directory if it doesn't exist
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    
    // Load existing cached files
    this.loadCachedFiles();
    
    if (!this.apiKey) {
      console.warn('ELEVEN_LABS_KEY not set in environment!');
    } else {
      console.log('elevenLabs service initialized');
    }
  }

  private loadCachedFiles() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      files.forEach(file => {
        if (file.endsWith('.mp3')) {
          const questionId = file.replace('.mp3', '');
          const filePath = path.join(this.cacheDir, file);
          this.audioCache.set(questionId, filePath);
        }
      });
    } catch (error) {
    }
  }

  async generateSpeech(
    text: string,
    questionId: string,
    emphasis?: string[]
  ): Promise<string> {
    // Check cache first
    if (this.audioCache.has(questionId)) {
      return this.audioCache.get(questionId)!;
    }

    // Enhance text with emphasis
    let enhancedText = text;
    if (emphasis && emphasis.length > 0) {
      emphasis.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        enhancedText = enhancedText.replace(regex, `, ${word},`);
      });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: enhancedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      // Save to file
      const audioPath = path.join(this.cacheDir, `${questionId}.mp3`);
      fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
      
      // Cache the path
      this.audioCache.set(questionId, audioPath);
      
      return audioPath;
      
    } catch (error) {
      throw error;
    }
  }

  getAudioPath(questionId: string): string | null {
    return this.audioCache.get(questionId) || null;
  }

  isCached(questionId: string): boolean {
    return this.audioCache.has(questionId);
  }

  async preGenerateAllAudio(questions: Array<{
    id: string;
    tts?: {
      enabled: boolean;
      voicePrompt?: string;
      emphasis?: string[];
    };
    text: string;
  }>): Promise<void> {
    
    let generated = 0;
    let skipped = 0;

    for (const question of questions) {
      if (!question.tts?.enabled) {
        skipped++;
        continue;
      }

      if (this.isCached(question.id)) {
        skipped++;
        continue;
      }

      try {
        const textToSpeak = question.tts.voicePrompt || question.text;
        await this.generateSpeech(
          textToSpeak,
          question.id,
          question.tts.emphasis
        );
        generated++;
        
        // Delay to avoid rate limiting
        await this.sleep(6000); // 6 seconds
        
      } catch (error) {
        console.error(`Failed to generate audio for ${question.id}:`, error);
      }
    }
  }

  getCacheStats(): {
    totalFiles: number;
    totalSize: string;
    files: string[];
  } {
    const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.mp3'));
    let totalSize = 0;

    files.forEach(file => {
      const stats = fs.statSync(path.join(this.cacheDir, file));
      totalSize += stats.size;
    });

    return {
      totalFiles: files.length,
      totalSize: this.formatBytes(totalSize),
      files
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ElevenLabsService;