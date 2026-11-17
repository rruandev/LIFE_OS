-- As funções de gatilho só devem rodar pelos gatilhos, nunca chamadas pela API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
