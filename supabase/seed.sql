do $$
begin
  if exists (select 1 from public.customers limit 1) then
    return;
  end if;

  insert into public.customers (
    id,
    full_name,
    phone_number,
    favorite_drink,
    preferred_seating,
    first_seen_at,
    segment
  )
  values
    ('c0000000-0000-4000-8000-000000000001', 'أحمد حسن', '01001234567', 'قهوة تركي', 'ركن المكتب', now() - make_interval(days => 30), 'VIP_CHAMPION'),
    ('c0000000-0000-4000-8000-000000000002', 'منى إبراهيم', '01102345678', 'لاتيه', 'التراس', now() - make_interval(days => 28), 'VIP_CHAMPION'),
    ('c0000000-0000-4000-8000-000000000003', 'عمر خالد', '01203456789', 'إسبريسو', 'البار', now() - make_interval(days => 25), 'LOYAL_REGULAR'),
    ('c0000000-0000-4000-8000-000000000004', 'سارة مصطفى', '01504567890', 'كابتشينو', 'داخلي', now() - make_interval(days => 13), 'LOYAL_REGULAR'),
    ('c0000000-0000-4000-8000-000000000005', 'يوسف عادل', '01005678901', 'موكا', 'التراس', now() - make_interval(days => 9), 'PROMISING_NEW'),
    ('c0000000-0000-4000-8000-000000000006', 'نور طارق', '01106789012', 'شاي أخضر', 'داخلي', now() - make_interval(days => 4), 'PROMISING_NEW'),
    ('c0000000-0000-4000-8000-000000000007', 'هدير سمير', '01207890123', 'آيس لاتيه', 'التراس', now() - make_interval(days => 32), 'SLIPPING_AWAY'),
    ('c0000000-0000-4000-8000-000000000008', 'كريم فتحي', '01508901234', 'قهوة فرنساوي', 'البار', now() - make_interval(days => 90), 'CHURNED_LOST'),
    ('c0000000-0000-4000-8000-000000000009', 'ليلى محمود', '01009012345', 'فلات وايت', 'التراس', now() - make_interval(days => 6), 'CUSTOM');

  insert into public.transactions (
    customer_id,
    receipt_number,
    amount,
    source,
    items_summary,
    created_at
  )
  select
    c.id,
    t.receipt_number,
    t.amount,
    t.source::public.order_source,
    t.items_summary,
    now() - make_interval(days => t.days_ago)
  from (
    values
      ('R-1001', '01001234567', 130.00, 90, 'FOODICS_IMPORT', '2 قهوة تركي، 1 كرواسون'),
      ('R-1002', '01001234567', 120.00, 80, 'CASHIER_MANUAL', '1 لاتيه كبير، 1 تشيز كيك'),
      ('R-1003', '01001234567', 110.00, 70, 'CASHIER_MANUAL', '3 إسبريسو، 2 مياه'),
      ('R-1004', '01001234567', 100.00, 65, 'CASHIER_MANUAL', '2 كابتشينو، 1 فطيرة'),
      ('R-1005', '01001234567', 90.00, 60, 'CASHIER_MANUAL', '1 فرنساوي، 1 ساندوتش'),
      ('R-1006', '01207890123', 60.00, 32, 'QR_LOYALTY', '1 آيس لاتيه، 1 كوكيز'),
      ('R-1007', '01001234567', 130.00, 30, 'CASHIER_MANUAL', '2 تركي، 1 تشيز كيك'),
      ('R-1008', '01102345678', 100.00, 28, 'CASHIER_MANUAL', '1 لاتيه، 1 تشيز كيك'),
      ('R-1009', '01001234567', 125.00, 25, 'CASHIER_MANUAL', '3 قهوة تركي، 2 كرواسون'),
      ('R-1010', '01203456789', 80.00, 25, 'CASHIER_MANUAL', '2 إسبريسو، 1 مياه'),
      ('R-1011', '01207890123', 50.00, 25, 'CASHIER_MANUAL', '2 شاي، 1 كرواسون'),
      ('R-1012', '01102345678', 105.00, 21, 'WEB_MENU', '2 لاتيه، 1 ساندوتش'),
      ('R-1013', '01001234567', 120.00, 20, 'CASHIER_MANUAL', '1 لاتيه، 1 ساندوتش'),
      ('R-1014', '01207890123', 45.00, 20, 'CASHIER_MANUAL', '1 موكا، 1 مياه'),
      ('R-1015', '01203456789', 70.00, 18, 'CASHIER_MANUAL', '1 كابتشينو، 1 كرواسون'),
      ('R-1016', '01102345678', 95.00, 16, 'CASHIER_MANUAL', '1 كابتشينو، 1 فطيرة'),
      ('R-1017', '01001234567', 100.00, 15, 'CASHIER_MANUAL', '2 إسبريسو، 1 فطيرة'),
      ('R-1018', '01203456789', 65.00, 14, 'CASHIER_MANUAL', '1 لاتيه، 1 كوكيز'),
      ('R-1019', '01504567890', 70.00, 13, 'WEB_MENU', '1 موكا، 1 ساندوتش'),
      ('R-1020', '01203456789', 60.00, 12, 'CASHIER_MANUAL', '2 تركي، 1 فطيرة'),
      ('R-1021', '01102345678', 90.00, 12, 'CASHIER_MANUAL', '2 موكا، 1 كوكيز'),
      ('R-1022', '01001234567', 110.00, 10, 'CASHIER_MANUAL', '4 تركي، 2 مياه'),
      ('R-1023', '01102345678', 90.00, 9, 'CASHIER_MANUAL', '1 آيس لاتيه، 1 كرواسون'),
      ('R-1024', '01005678901', 80.00, 9, 'CASHIER_MANUAL', '1 لاتيه، 1 تشيز كيك'),
      ('R-1025', '01504567890', 55.00, 8, 'QR_LOYALTY', '1 كابتشينو، 1 كوكيز'),
      ('R-1026', '01102345678', 85.00, 7, 'CASHIER_MANUAL', '1 فلات وايت، 1 تشيز كيك'),
      ('R-1027', '01001234567', 95.00, 6, 'CASHIER_MANUAL', '2 كابتشينو، 1 كوكيز'),
      ('R-1028', '01009012345', 90.00, 6, 'CASHIER_MANUAL', '1 فلات وايت، 1 تشيز كيك'),
      ('R-1029', '01504567890', 50.00, 5, 'CASHIER_MANUAL', '1 آيس لاتيه، 1 مياه'),
      ('R-1030', '01106789012', 50.00, 4, 'QR_LOYALTY', '1 شاي أخضر، 1 كوكيز'),
      ('R-1031', '01001234567', 80.00, 3, 'CASHIER_MANUAL', '1 تركي، 1 كرواسون'),
      ('R-1032', '01005678901', 70.00, 2, 'CASHIER_MANUAL', '2 إسبريسو، 1 كرواسون'),
      ('R-1033', '01009012345', 80.00, 1, 'WEB_MENU', '2 كابتشينو، 1 ساندوتش')
  ) as t(receipt_number, phone_number, amount, days_ago, source, items_summary)
  join public.customers c on c.phone_number = t.phone_number;

  update public.customers
  set segment = 'VIP_CHAMPION'
  where id in (
    'c0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002'
  );

  update public.customers
  set segment = 'LOYAL_REGULAR'
  where id in (
    'c0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000004'
  );

  update public.customers
  set segment = 'PROMISING_NEW'
  where id in (
    'c0000000-0000-4000-8000-000000000005',
    'c0000000-0000-4000-8000-000000000006'
  );

  update public.customers
  set segment = 'SLIPPING_AWAY'
  where id = 'c0000000-0000-4000-8000-000000000007';

  update public.customers
  set segment = 'CHURNED_LOST'
  where id = 'c0000000-0000-4000-8000-000000000008';

  update public.customers
  set segment = 'CUSTOM'
  where id = 'c0000000-0000-4000-8000-000000000009';
end $$;
