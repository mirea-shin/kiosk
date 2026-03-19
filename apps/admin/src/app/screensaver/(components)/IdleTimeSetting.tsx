'use client';
import { API_URL } from '@/lib/api';
import React, { useState } from 'react';

export default function IdleTimeSetting({ value }: { value: number }) {
  const [editedIdleTime, setEditedIdleTime] = useState(value);

  const handleTimeInputChange = (
    event: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => {
    const { value } = event.target;
    setEditedIdleTime(Number(value));
  };

  const updateIdleTime = async () => {
    const response = await fetch(`${API_URL}/api/screensaver`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idle_timeout_seconds: editedIdleTime }),
    });

    return response;
  };

  const handleSubmitIdleSetting = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editedIdleTime || editedIdleTime < 0)
      return console.log('시간을 셋팅해주세오');
    const result = await updateIdleTime();
    if (result.ok) {
      console.log('시간이 업데이트 되었읍니다.');
    }
  };

  return (
    <div>
      <h3>timeout</h3>
      <p>Set how long the kiosk waits before showing the screensaver</p>
      <form onSubmit={handleSubmitIdleSetting}>
        <input
          min={0}
          type="number"
          value={editedIdleTime}
          onChange={handleTimeInputChange}
        />
        <button type="submit">저장</button>
      </form>
    </div>
  );
}
