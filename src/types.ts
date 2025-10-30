export type Attachment = {
  id: number;
  title: string;
  description: string;
  mime_type: string;
  url: string;
  media_type: string;
  alt_text?: string;
};

export type Item = {
  id: number;
  title: string;
  description?: string;
  _thumbnail_id?: string;
  imageUrl?: string | null;
  author?: string;
  date?: string;
  type?: string;
  attachments?: Attachment[];
};

export type ApiItem = {
  id: number;
  title?: { rendered?: string };
  description?: string;
  _thumbnail_id?: string;
  metadata?: Record<string, { value?: unknown }>;
  thumbnail?: Record<string, string[]>;
  document_as_html?: string;
};
