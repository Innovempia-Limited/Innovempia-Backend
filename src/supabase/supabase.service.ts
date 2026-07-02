import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!,
    );
  }

  async uploadFile(file: any, folder: string): Promise<string> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.config.get<string>('SUPABASE_BUCKET_NAME')!)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.config.get<string>('SUPABASE_BUCKET_NAME')!)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}