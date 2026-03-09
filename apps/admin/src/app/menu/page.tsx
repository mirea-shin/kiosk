import React from 'react';

import MenuCard from './(components)/MenuCard';

import type { Menu, MenuOption } from '@kiosk/shared';

const API_URL = 'http://localhost:3001';

const getMenus = async () => {
  const response = await fetch(`${API_URL}/api/menus`);
  const data = await response.json();

  return data;
};

export default async function MenuPage() {
  const menus = await getMenus();

  console.log(menus);

  return (
    <div>
      <h2>메인 디쉬</h2>
      <div className="grid grid-cols-2">
        {menus?.map((m: Menu) => (
          <div key={m.id}>
            <MenuCard
              id={m.id}
              name={m.name}
              description={m.description}
              price={m.price}
              is_available={m.is_available}
              image_url={m.image_url}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
