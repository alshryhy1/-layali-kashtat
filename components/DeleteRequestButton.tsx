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
        if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) {
          e.preventDefault();
        }
      }}
      style={{ display: "inline-block", marginLeft: 8 }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        style={{
          background: "transparent",
          border: "1px solid #ef4444",
          color: "#ef4444",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: "bold",
        }}
        title="حذف نهائي"
      >
        حذف
      </button>
    </form>
  );
}
