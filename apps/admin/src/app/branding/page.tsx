import type { Metadata } from 'next';
import type { BrandingConfig } from '@kiosk/shared';
import { api } from '@/lib/api-client';
import PageHeader from '@/components/PageHeader';
import BrandingSettings from './_components/BrandingSettings';

export const metadata: Metadata = {
  title: '색상 관리',
  description: '키오스크 브랜드 색상을 설정합니다',
};

const getBranding = () => api.get<BrandingConfig>('/api/branding', { cache: 'no-store' });

export default async function BrandingPage() {
  const branding = await getBranding();

  return (
    <div>
      <PageHeader
        title="색상 관리"
        description="키오스크 UI에 적용되는 브랜드 색상을 설정하세요"
      />
      <div className="p-6">
        <BrandingSettings primaryColor={branding.primary_color} />
      </div>
    </div>
  );
}
