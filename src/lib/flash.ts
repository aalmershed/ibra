/** رسالة قصيرة تنعرض في الشاشة اللي نرجع لها بعد الحفظ (مثل «تم النشر») */
let pending: string | null = null;

export function setFlash(message: string) {
  pending = message;
}

export function takeFlash() {
  const message = pending;
  pending = null;
  return message;
}
