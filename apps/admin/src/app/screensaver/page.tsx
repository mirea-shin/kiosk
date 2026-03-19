import { API_URL } from '@/lib/api';
import React from 'react';

import IdleTimeSetting from './(components)/IdleTimeSetting';
import MediaSetting from './(components)/MediaSetting';

const getScreenSaver = async () => {
  const response = await fetch(`${API_URL}/api/screensaver`);
  return response.json();
};
export default async function page() {
  const screenSaver = await getScreenSaver();

  console.log(screenSaver.media);

  return (
    <div>
      <div className="flex flex-col gap-y-5">
        <IdleTimeSetting value={screenSaver.idle_timeout_seconds} />
        <MediaSetting media={screenSaver.media} />
      </div>
    </div>
  );
}
