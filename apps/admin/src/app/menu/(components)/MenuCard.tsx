'use client';
import React from 'react';

export default function MenuCard({
  id,
  name,
  description,
  price,
  is_available,
  image_url,
  handleEditMenu,
  handleDeleteMenu,
}: {
  id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url: string | null;
  handleEditMenu: () => void;
  handleDeleteMenu: () => void;
}) {
  const EMPTY_IMG = 'HTTP';

  return (
    <div className="border border-zinc-200 rounded-2xl flex justify-baseline">
      <div>
        <img src={image_url || EMPTY_IMG} alt="메뉴이미지" />
      </div>
      <div>
        <header className="flex justify-between">
          <h4>{name}</h4>
          <input
            type="checkbox"
            checked={is_available}
            onChange={(e) => {
              console.log('do something', id);
            }}
          />
        </header>
        <p>{description}</p>
        <footer className="flex justify-between">
          <p>{price}</p>
          <div>
            <button onClick={handleEditMenu}>수정</button>
            <button onClick={handleDeleteMenu}>삭제</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
