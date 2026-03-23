import type { Metadata } from 'next';
import type { BrandingConfig } from '@kiosk/shared';
import { API_URL } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import BrandingSettings from './(components)/BrandingSettings';

export const metadata: Metadata = {
  title: '색상 관리',
  description: '키오스크 브랜드 색상을 설정합니다',
};

const getBranding = async (): Promise<BrandingConfig> => {
  const res = await fetch(`${API_URL}/api/branding`, { cache: 'no-store' });
  return res.json();
};

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
