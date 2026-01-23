"use client";

import React from "react";

type Props = {
  id: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export default function DeleteRequestButton({ id, deleteAction }: Props) {
  return (
    <form
      action={deleteAction}
      onSubmit={(e) => {
        if (!confirm("هل أنت متأكد من الحذف؟")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        title="حذف الطلب"
        style={{
          background: "#fee2e2",
          color: "#b91c1c",
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        🗑️
      </button>
    </form>
  );
}
