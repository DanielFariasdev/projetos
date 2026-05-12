import express from "express";

const app = express();
app.use(express.json());

// ── Banco de dados em memória ─────────────────────────────────────────────────
let alunos = [];
let planos = [];
let pagamentos = [];

// ── Funções auxiliares ────────────────────────────────────────────────────────
function buscarPlano(id) {
    return planos.find(p => p.id === id) || null;
}

function buscarAluno(id) {
    return alunos.find(a => a.id === id) || null;
}

// ── Rotas de Planos ───────────────────────────────────────────────────────────
app.post("/planos", (req, res) => {
    const { nome, preco, duracaoMeses } = req.body;

    if (!nome || nome.trim() === "") {
        return res.status(400).json({ erro: "Nome do plano vazio." });
    }
    if (preco <= 0) {
        return res.status(400).json({ erro: "Preço deve ser maior que zero." });
    }
    if (duracaoMeses <= 0) {
        return res.status(400).json({ erro: "Duração deve ser maior que zero." });
    }

    const plano = {
        id: planos.reduce((maxId, p) => Math.max(maxId, p.id), 0) + 1,
        nome,
        preco,
        duracaoMeses
    };
    planos.push(plano);
    return res.status(201).json(plano);
});

app.get("/planos", (req, res) => {
    return res.json(planos);
});

app.get("/planos/:id", (req, res) => {
    const plano = buscarPlano(Number(req.params.id));
    if (!plano) {
        return res.status(404).json({ erro: "Plano não encontrado." });
    }
    return res.json(plano);
});

// ── Rotas de Alunos ───────────────────────────────────────────────────────────
app.post("/alunos", (req, res) => {
    const { nome, idPlano } = req.body;

    if (!nome || nome.trim() === "") {
        return res.status(400).json({ erro: "Nome do aluno vazio." });
    }
    if (!buscarPlano(idPlano)) {
        return res.status(404).json({ erro: "Plano não encontrado." });
    }

    const aluno = {
        id: alunos.reduce((maxId, a) => Math.max(maxId, a.id), 0) + 1,
        nome,
        idPlano,
        ativo: true
    };
    alunos.push(aluno);
    return res.status(201).json(aluno);
});

app.get("/alunos", (req, res) => {
    return res.json(alunos);
});

app.get("/alunos/:id", (req, res) => {
    const aluno = buscarAluno(Number(req.params.id));
    if (!aluno) {
        return res.status(404).json({ erro: "Aluno não encontrado." });
    }
    return res.json(aluno);
});

app.get("/alunos/plano/:idPlano", (req, res) => {
    const idPlano = Number(req.params.idPlano);
    if (!buscarPlano(idPlano)) {
        return res.status(404).json({ erro: "Plano não encontrado." });
    }
    const resultado = alunos.filter(a => a.idPlano === idPlano);
    return res.json(resultado);
});

// ── Rotas de Pagamentos ───────────────────────────────────────────────────────
app.post("/pagamentos", (req, res) => {
    const { idAluno } = req.body;

    const aluno = buscarAluno(idAluno);
    if (!aluno) {
        return res.status(404).json({ erro: "Aluno não encontrado." });
    }

    const plano = buscarPlano(aluno.idPlano);
    if (!plano) {
        return res.status(404).json({ erro: "Plano não encontrado." });
    }

    const pagamento = {
        idAluno,
        idPlano: aluno.idPlano,
        valor: plano.preco,
        data: new Date().toLocaleDateString()
    };
    pagamentos.push(pagamento);
    return res.status(201).json(pagamento);
});

app.get("/pagamentos", (req, res) => {
    return res.json(pagamentos);
});

// ── Rotas de Relatórios ───────────────────────────────────────────────────────
app.get("/relatorios/total", (req, res) => {
    const total = pagamentos.reduce((acc, p) => acc + p.valor, 0);
    return res.json({ totalArrecadado: total });
});

app.get("/relatorios/mais-popular", (req, res) => {
    if (alunos.length === 0) {
        return res.status(404).json({ erro: "Nenhum aluno cadastrado." });
    }

    const contagem = alunos.reduce((acc, aluno) => {
        acc[aluno.idPlano] = (acc[aluno.idPlano] || 0) + 1;
        return acc;
    }, {});

    const idMaior = Object.keys(contagem).reduce((melhor, id) =>
        contagem[id] > contagem[melhor] ? id : melhor
    );

    return res.json(buscarPlano(Number(idMaior)));
});

app.get("/relatorios/ranking", (req, res) => {
    const receitaPorPlano = pagamentos.reduce((acc, pagamento) => {
        acc[pagamento.idPlano] = (acc[pagamento.idPlano] || 0) + pagamento.valor;
        return acc;
    }, {});

    const ranking = Object.entries(receitaPorPlano)
        .sort((a, b) => b[1] - a[1])
        .map(([idPlano, totalArrecadado]) => ({
            plano: buscarPlano(Number(idPlano)).nome,
            totalArrecadado
        }));

    return res.json(ranking);
});

// ── Servidor ──────────────────────────────────────────────────────────────────
const PORTA = 3110;
app.listen(PORTA, "0.0.0.0", () => {
    console.log("Servidor rodando em http://localhost:3110");
});