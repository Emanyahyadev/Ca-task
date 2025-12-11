
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hjuscodpytjhcvlsyzzw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdXNjb2RweXRqaGN2bHN5enp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODgyNTksImV4cCI6MjA4MDg2NDI1OX0.5pI1Zl38M84kXeSyRkQzlHwgMfKnBamaYTAZGVV3aCs";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBuckets() {
    console.log('Checking buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error fetching buckets:', error);
        return;
    }

    console.log('Buckets found:', buckets);

    // Check specific bucket
    const bucketName = 'Ca-task-Documents';
    console.log(`\nChecking bucket: ${bucketName}`);
    const { data: files, error: listError } = await supabase.storage.from(bucketName).list();

    if (listError) {
        // If bucket doesn't exist, it might error here? Or just return empty?
        console.error(`Error listing files in ${bucketName}:`, listError);
    } else {
        console.log(`Files in root of ${bucketName}:`, files);
    }
}

checkBuckets();
