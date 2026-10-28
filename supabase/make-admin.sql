-- تحويل حساب إلى مدير
-- 1) سجّل حساب عادي من داخل التطبيق أولاً
-- 2) غيّر الإيميل تحت لإيميل حسابك، ثم شغّل الأمر في SQL Editor

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'ضع_ايميلك_هنا@example.com');

-- للتأكد:
select p.full_name, u.email, p.role
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin';
