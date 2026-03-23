import type { Metadata } from 'next';
import type { ScreensaverAdminData } from '@kiosk/shared';
import { API_URL } from '@/lib/api';
import React from 'react';

import PageHeader from '@/components/PageHeader';
import IdleTimeSetting from './(components)/IdleTimeSetting';
import MediaSetting from './(components)/MediaSetting';

export const metadata: Metadata = {
  title: 'Screensaver',
  description: 'Configure screensaver media and idle timeout settings',
};

const getScreenSaver = async (): Promise<ScreensaverAdminData> => {
  const response = await fetch(`${API_URL}/api/screensaver`, { cache: 'no-store' });
  return response.json();
};

export default async function ScreensaverPage() {
  const screenSaver = await getScreenSaver();

  return (
    <div>
      <PageHeader
        title="화면 관리"
        description="스크린세이버와 화면 대기 시간을 설정하세요"
      />
      <div className="p-6">
        <div className="flex flex-col gap-y-5">
          <IdleTimeSetting value={screenSaver.idle_timeout_seconds} />
          <MediaSetting
            media={screenSaver.media}
            hasPendingChanges={screenSaver.has_pending_changes}
            pendingChanges={screenSaver.pending_changes}
          />
        </div>
      </div>
    </div>
  );
}
