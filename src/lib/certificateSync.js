import { supabase } from './supabase';
import { generateCertificateCode, isCourseEligibleForCertificate } from './courseCertificates';

export async function fetchUserCertificates(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('course_certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) {
    console.warn('[certificateSync] fetch failed', error.message);
    return [];
  }
  return data || [];
}

export async function fetchCertificate(userId, courseSlug) {
  if (!userId || !courseSlug) return null;
  const { data, error } = await supabase
    .from('course_certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_slug', courseSlug)
    .maybeSingle();

  if (error) {
    console.warn('[certificateSync] fetch one failed', error.message);
    return null;
  }
  return data;
}

export async function issueCourseCertificate({ userId, courseSlug, holderName, completedMap }) {
  if (!userId || !courseSlug) return { error: 'auth_required' };

  if (!isCourseEligibleForCertificate(courseSlug, completedMap)) {
    return { error: 'not_eligible' };
  }

  const existing = await fetchCertificate(userId, courseSlug);
  if (existing) return { certificate: existing };

  const certificate_code = generateCertificateCode(courseSlug);
  const { data, error } = await supabase
    .from('course_certificates')
    .insert({
      user_id: userId,
      course_slug: courseSlug,
      certificate_code,
      holder_name: holderName || null,
    })
    .select()
    .single();

  if (error) {
    console.warn('[certificateSync] issue failed', error.message);
    return { error: error.message };
  }

  return { certificate: data };
}
