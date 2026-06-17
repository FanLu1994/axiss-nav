export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  icon?: string | null;
  order: number;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  category?: string | null;
  color?: string | null;
  analysisStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  lastAnalyzedAt?: string | null;
  lastCheckedAt?: string | null;
  isAvailable?: boolean | null;
}

export interface RecommendedLinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  clickCount: number;
}

export interface TagItem {
  id: string;
  name: string;
  color?: string | null;
  icon: string;
  count: number;
}

export interface HomePageData {
  links: LinkItem[];
  recommendedLinks: RecommendedLinkItem[];
  randomTags: TagItem[];
  hasMore: boolean;
}
