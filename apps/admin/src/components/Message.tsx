'use client';
import React, { useEffect, useState } from 'react';

export default function Message() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onopen = (e) => {
      console.log(e);
      console.log('소켓 오픈..?');
    };

    ws.onmessage = (e) => {
      const { event, data } = JSON.parse(e.data);

      console.log(event);
      console.log(data);
      if (event === 'order:created') {
        // 새 주문 목록에 추가
        // 업데이트
        setMsg('오더가 추가되었다');
      } else {
        setMsg('오더가 업데이트되었다');
      }
    };

    return () => ws.close(); // 컴포넌트 언마운트 시 연결 끊기
  }, []);
  return <div>{msg}</div>;
}
