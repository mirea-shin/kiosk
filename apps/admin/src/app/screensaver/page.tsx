import type { Metadata } from 'next';
import { API_URL } from '@/lib/api';
import React from 'react';

import PageHeader from '@/components/PageHeader';
import IdleTimeSetting from './(components)/IdleTimeSetting';
import MediaSetting from './(components)/MediaSetting';

export const metadata: Metadata = {
  title: 'Screensaver',
  description: 'Configure screensaver media and idle timeout settings',
};

const getScreenSaver = async () => {
  const response = await fetch(`${API_URL}/api/screensaver`);
  return response.json();
};

export default async function ScreensaverPage() {
  const screenSaver = await getScreenSaver();

  return (
    <div>
      <PageHeader
        title="Screensaver"
        description="Configure screensaver media and idle timeout settings"
      />
      <div className="p-6">
        <div className="flex flex-col gap-y-5">
          <IdleTimeSetting value={screenSaver.idle_timeout_seconds} />
          <MediaSetting media={screenSaver.media} />
        </div>
      </div>
    </div>
  );
}
