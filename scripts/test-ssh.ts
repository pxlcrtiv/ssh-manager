import ssh2 from 'ssh2';
const { Client, Server } = ssh2;
import { readFileSync } from 'fs';
import { join } from 'path';

// Generate a temporary host key for the server
// In a real scenario, we'd use a pre-generated key, but for this test we'll try to use a dummy one or generate it.
// Actually, generating a key in node requires 'ssh2' utils or 'crypto'.
// Let's assume we can use a dummy key or just skip host key verification in the client.

const HOST = '127.0.0.1';
const PORT = 9999;
const USERNAME = 'testuser';
const PASSWORD = 'testpassword';

// Create a mock SSH server
const server = new Server({
    hostKeys: [readFileSync(join(process.cwd(), 'electron/test-host-key'))] // We need a host key
}, (client) => {
    console.log('Client connected!');

    client.on('authentication', (ctx) => {
        if (ctx.method === 'password' && ctx.username === USERNAME && ctx.password === PASSWORD) {
            ctx.accept();
        } else {
            ctx.reject();
        }
    });

    client.on('ready', () => {
        console.log('Client authenticated!');

        client.on('session', (accept, reject) => {
            const session = accept();
            session.on('shell', (accept, reject) => {
                const stream = accept();
                stream.write('Welcome to the mock SSH server!\r\n');
                stream.on('data', (data) => {
                    console.log('Received from client:', data.toString());
                    stream.write(`Echo: ${data}`);
                });
            });
        });
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Mock SSH Server listening on ${HOST}:${PORT}`);

    // Now connect with the client
    const conn = new Client();
    conn.on('ready', () => {
        console.log('Client :: ready');
        conn.shell((err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                console.log('Stream :: close');
                conn.end();
                server.close();
                process.exit(0);
            }).on('data', (data: any) => {
                console.log('STDOUT: ' + data);
                if (data.toString().includes('Welcome')) {
                    stream.write('ls\n');
                    setTimeout(() => stream.end(), 1000);
                }
            });
        });
    }).on('error', (err) => {
        console.error('Client error:', err);
        server.close();
        process.exit(1);
    }).connect({
        host: HOST,
        port: PORT,
        username: USERNAME,
        password: PASSWORD,
        algorithms: {
            serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ssh-ed25519'],
            kex: ['diffie-hellman-group1-sha1', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521', 'diffie-hellman-group-exchange-sha256', 'diffie-hellman-group14-sha1'],
            cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'aes128-gcm', 'aes128-cbc', '3des-cbc'],
            hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1']
        }
    });
});
