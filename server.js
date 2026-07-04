import { Hono } from 'hono';

const app = new Hono();

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Video Generator</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div class="min-h-screen flex flex-col">
        <nav class="bg-slate-950 border-b border-slate-700 p-4">
          <div class="max-w-6xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold">🎬 AI Video Generator</h1>
            <p class="text-slate-400">Create long-form videos with AI</p>
          </div>
        </nav>

        <main class="flex-1 max-w-6xl mx-auto w-full p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Create Video Section -->
            <div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 class="text-xl font-bold mb-4">Create New Video</h2>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Video Title</label>
                  <input type="text" id="title" placeholder="My Awesome Video" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400">
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Description</label>
                  <textarea id="description" placeholder="Describe your video..." class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 h-20"></textarea>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Script or Prompt</label>
                  <textarea id="script" placeholder="Enter your script or describe what you want the video to be about..." class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 h-32"></textarea>
                </div>

                <button onclick="generateScript()" class="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition">
                  Generate Script from Prompt
                </button>

                <button onclick="createVideo()" class="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium transition">
                  Create Video
                </button>
              </div>
            </div>

            <!-- Video List Section -->
            <div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 class="text-xl font-bold mb-4">Your Videos</h2>
              <div id="videoList" class="space-y-3 max-h-96 overflow-y-auto">
                <p class="text-slate-400">Loading videos...</p>
              </div>
              <button onclick="loadVideos()" class="w-full mt-4 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-medium transition">
                Refresh
              </button>
            </div>
          </div>

          <!-- Video Details Modal -->
          <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700">
              <div class="flex justify-between items-center mb-4">
                <h3 id="modalTitle" class="text-xl font-bold"></h3>
                <button onclick="closeModal()" class="text-slate-400 hover:text-white">✕</button>
              </div>
              <div id="modalContent" class="space-y-4"></div>
            </div>
          </div>
        </main>
      </div>

      <script>
        const API_URL = '${apiUrl}';
        const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);

        async function generateScript() {
          const prompt = document.getElementById('script').value;
          if (!prompt) {
            alert('Please enter a prompt');
            return;
          }

          try {
            const res = await fetch(\`\${API_URL}/api/generate-script\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt, duration: 60 })
            });
            const data = await res.json();
            document.getElementById('script').value = data.script;
          } catch (error) {
            alert('Error generating script: ' + error.message);
          }
        }

        async function createVideo() {
          const title = document.getElementById('title').value;
          const description = document.getElementById('description').value;
          const script = document.getElementById('script').value;

          if (!script) {
            alert('Please enter a script');
            return;
          }

          try {
            const res = await fetch(\`\${API_URL}/api/videos\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, description, script, userId })
            });
            const data = await res.json();
            alert('Video created! ID: ' + data.videoId);
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            document.getElementById('script').value = '';
            loadVideos();
          } catch (error) {
            alert('Error creating video: ' + error.message);
          }
        }

        async function loadVideos() {
          try {
            const res = await fetch(\`\${API_URL}/api/videos?userId=\${userId}\`);
            const videos = await res.json();
            const list = document.getElementById('videoList');
            
            if (videos.length === 0) {
              list.innerHTML = '<p class="text-slate-400">No videos yet</p>';
              return;
            }

            list.innerHTML = videos.map(v => \`
              <div class="bg-slate-700 p-3 rounded cursor-pointer hover:bg-slate-600 transition" onclick="showVideoDetails('\${v.id}')">
                <p class="font-medium">\${v.title}</p>
                <p class="text-sm text-slate-400">Status: <span class="text-blue-400">\${v.status}</span></p>
                <p class="text-xs text-slate-500">\${new Date(v.created_at).toLocaleDateString()}</p>
              </div>
            \`).join('');
          } catch (error) {
            document.getElementById('videoList').innerHTML = '<p class="text-red-400">Error loading videos</p>';
          }
        }

        async function showVideoDetails(videoId) {
          try {
            const res = await fetch(\`\${API_URL}/api/videos/\${videoId}\`);
            const video = await res.json();
            
            document.getElementById('modalTitle').textContent = video.title;
            document.getElementById('modalContent').innerHTML = \`
              <p><strong>Status:</strong> <span class="text-blue-400">\${video.status}</span></p>
              <p><strong>Description:</strong> \${video.description || 'N/A'}</p>
              <p><strong>Created:</strong> \${new Date(video.created_at).toLocaleString()}</p>
              \${video.video_url ? \`<p><strong>Video URL:</strong> <a href="\${video.video_url}" target="_blank" class="text-blue-400 hover:underline">Watch</a></p>\` : ''}
              \${video.jobStatus ? \`<p><strong>Progress:</strong> \${video.jobStatus.progress}%</p>\` : ''}
            \`;
            document.getElementById('modal').classList.remove('hidden');
          } catch (error) {
            alert('Error loading video details: ' + error.message);
          }
        }

        function closeModal() {
          document.getElementById('modal').classList.add('hidden');
        }

        loadVideos();
        setInterval(loadVideos, 5000);
      </script>
    </body>
    </html>
  `);
});

export default app;
