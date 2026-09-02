import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function dbSyncPlugin() {
  const dbPath = path.resolve(__dirname, 'server_db.json');

  return {
    name: 'db-sync-plugin',
    configureServer(server) {
      server.middlewares.use('/api/sync-pos', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          if (fs.existsSync(dbPath)) {
            try {
              const data = fs.readFileSync(dbPath, 'utf-8');
              res.end(data);
              return;
            } catch (e) {}
          }
          res.end(JSON.stringify([]));
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              fs.writeFileSync(dbPath, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        }
      });

      server.middlewares.use('/api/technician-tasks', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
            const queryTech = (urlParams.get('technician') || '').toLowerCase().trim();

            if (!fs.existsSync(dbPath)) {
              res.end(JSON.stringify({ tasks: [] }));
              return;
            }

            const raw = fs.readFileSync(dbPath, 'utf-8');
            const posList = JSON.parse(raw);
            const tasks = [];

            (posList || []).forEach(po => {
              (po.samples || []).forEach(sample => {
                const sampleTech = (sample.testedBy || sample.assignedTechnician || '').toLowerCase();
                const tests = sample.tests || [];

                tests.forEach(test => {
                  const testTech = (test.technicianName || test.assignedTechnician || '').toLowerCase();
                  const isMatch = !queryTech ||
                    (sampleTech && (sampleTech.includes(queryTech) || queryTech.includes(sampleTech))) ||
                    (testTech && (testTech.includes(queryTech) || queryTech.includes(testTech)));

                  if (isMatch) {
                    tasks.push({
                      poId: po.id,
                      poNumber: po.poNumber,
                      clientName: po.clientName,
                      sampleId: sample.id,
                      sampleCode: sample.sampleCode,
                      idLab: sample.idLab,
                      sampleType: sample.sampleType,
                      testId: test.id,
                      testTypeCode: test.testTypeCode || test.testTypeId,
                      testTypeName: test.testTypeName,
                      technicianName: test.technicianName || sample.testedBy,
                      status: test.status || 'Sedang Diuji',
                      calculationStatus: test.calculationStatus || 'Draft Data',
                      calculationData: test.calculationData || {}
                    });
                  }
                });
              });
            });

            res.end(JSON.stringify({ success: true, count: tasks.length, tasks }));
          } catch (e) {
            res.end(JSON.stringify({ error: e.message, tasks: [] }));
          }
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dbSyncPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 5175,
    allowedHosts: true
  }
})
