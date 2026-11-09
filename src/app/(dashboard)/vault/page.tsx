import React from 'react';
import { Metadata } from 'next';
import PersonalVault from '@/components/vault/PersonalVault';

export const metadata: Metadata = {
  title: 'Kho lưu trữ cá nhân (Vault) | LifeOS',
  description: 'Kho bảo mật thông tin nhạy cảm được bảo vệ bằng mã PIN cấp 2.',
};

export default function VaultPage() {
  return (
    <div className="w-full">
      <PersonalVault />
    </div>
  );
}
