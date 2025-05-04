
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function EstoqueApp() {
  const [entrada, setEntrada] = useState([]);
  const [saida, setSaida] = useState([]);
  const [aba, setAba] = useState("entrada");

  const [formEntrada, setFormEntrada] = useState({
    produto: "",
    quantidade: "",
    valor: "",
    fornecedor: "",
    data: "",
    observacao: "",
  });

  const [formSaida, setFormSaida] = useState({
    produto: "",
    quantidade: "",
    destino: "",
    responsavel: "",
    data: "",
  });

  const planilhaID = "11V2k5txES6TyP-fw5yCVjrbxySCmkV86g5cQmT7jQEc";

  useEffect(() => {
    fetch(`https://opensheet.elk.sh/${planilhaID}/Entrada`)
      .then(res => res.json())
      .then(data => setEntrada(data));

    fetch(`https://opensheet.elk.sh/${planilhaID}/Saída`)
      .then(res => res.json())
      .then(data => setSaida(data));
  }, []);

  const handleEntrada = async () => {
    await fetch("https://controle-estoque-backend.onrender.com/entrada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEntrada)
    });
    setEntrada([...entrada, formEntrada]);
    setFormEntrada({ produto: "", quantidade: "", valor: "", fornecedor: "", data: "", observacao: "" });
  };

  const handleSaida = async () => {
    await fetch("https://controle-estoque-backend.onrender.com/saida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formSaida)
    });
    setSaida([...saida, formSaida]);
    setFormSaida({ produto: "", quantidade: "", destino: "", responsavel: "", data: "" });
  };

  const calcularEstoqueAtual = () => {
    const totaisEntrada = entrada.reduce((acc, item) => {
      const qtd = parseFloat(item.quantidade) || 0;
      acc[item.produto] = (acc[item.produto] || 0) + qtd;
      return acc;
    }, {});
    const totaisSaida = saida.reduce((acc, item) => {
      const qtd = parseFloat(item.quantidade) || 0;
      acc[item.produto] = (acc[item.produto] || 0) + qtd;
      return acc;
    }, {});
    const produtos = new Set([...Object.keys(totaisEntrada), ...Object.keys(totaisSaida)]);
    return Array.from(produtos).map(produto => ({
      produto,
      quantidade: (totaisEntrada[produto] || 0) - (totaisSaida[produto] || 0),
    }));
  };

  const calcularCMV = () => {
    return saida.reduce((total, item) => {
      const entradaProduto = entrada.find(e => e.produto === item.produto);
      const valorUnitario = entradaProduto ? parseFloat(entradaProduto.valor) / parseFloat(entradaProduto.quantidade) : 0;
      const qtd = parseFloat(item.quantidade) || 0;
      return total + (valorUnitario * qtd);
    }, 0).toFixed(2);
  };

  const gerarDadosGrafico = () => {
    const totais = {};
    saida.forEach(item => {
      const nome = item.produto;
      totais[nome] = (totais[nome] || 0) + parseFloat(item.quantidade || 0);
    });
    return Object.entries(totais).map(([produto, total]) => ({ produto, total }));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex space-x-4 mb-4">
        <button onClick={() => setAba("entrada")} className={\`px-4 py-2 rounded \${aba === "entrada" ? "bg-blue-500 text-white" : "bg-gray-200"}\`}>Entrada</button>
        <button onClick={() => setAba("saida")} className={\`px-4 py-2 rounded \${aba === "saida" ? "bg-blue-500 text-white" : "bg-gray-200"}\`}>Saída</button>
        <button onClick={() => setAba("resumo")} className={\`px-4 py-2 rounded \${aba === "resumo" ? "bg-blue-500 text-white" : "bg-gray-200"}\`}>Resumo</button>
        <button onClick={() => setAba("painel")} className={\`px-4 py-2 rounded \${aba === "painel" ? "bg-blue-500 text-white" : "bg-gray-200"}\`}>Painel</button>
      </div>

      {aba === "entrada" && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Registrar Entrada</h2>
          <input placeholder="Produto" value={formEntrada.produto} onChange={e => setFormEntrada({ ...formEntrada, produto: e.target.value })} className="w-full p-2 border rounded" list="produtosSugestoes" />
          <datalist id="produtosSugestoes">
            {[...new Set([...entrada, ...saida].map(i => i.produto))].map((nome, i) => <option key={i} value={nome} />)}
          </datalist>
          <input placeholder="Quantidade" value={formEntrada.quantidade} onChange={e => setFormEntrada({ ...formEntrada, quantidade: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Valor Total Pago" value={formEntrada.valor} onChange={e => setFormEntrada({ ...formEntrada, valor: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Fornecedor" value={formEntrada.fornecedor} onChange={e => setFormEntrada({ ...formEntrada, fornecedor: e.target.value })} className="w-full p-2 border rounded" />
          <input type="date" value={formEntrada.data} onChange={e => setFormEntrada({ ...formEntrada, data: e.target.value })} className="w-full p-2 border rounded" />
          <textarea placeholder="Observação" value={formEntrada.observacao} onChange={e => setFormEntrada({ ...formEntrada, observacao: e.target.value })} className="w-full p-2 border rounded" />
          <button onClick={handleEntrada} className="bg-green-500 text-white px-4 py-2 rounded">Salvar Entrada</button>
        </div>
      )}

      {aba === "saida" && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Registrar Saída</h2>
          <input placeholder="Produto" value={formSaida.produto} onChange={e => setFormSaida({ ...formSaida, produto: e.target.value })} className="w-full p-2 border rounded" list="produtosSugestoes" />
          <input placeholder="Quantidade" value={formSaida.quantidade} onChange={e => setFormSaida({ ...formSaida, quantidade: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Destino" value={formSaida.destino} onChange={e => setFormSaida({ ...formSaida, destino: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Responsável" value={formSaida.responsavel} onChange={e => setFormSaida({ ...formSaida, responsavel: e.target.value })} className="w-full p-2 border rounded" />
          <input type="date" value={formSaida.data} onChange={e => setFormSaida({ ...formSaida, data: e.target.value })} className="w-full p-2 border rounded" />
          <button onClick={handleSaida} className="bg-red-500 text-white px-4 py-2 rounded">Salvar Saída</button>
        </div>
      )}

      {aba === "resumo" && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Resumo de Estoque</h2>
          <ul>
            {calcularEstoqueAtual().map((item, i) => (
              <li key={i} className="border p-2 rounded mt-1">{item.produto}: {item.quantidade}</li>
            ))}
          </ul>
          <div className="mt-4 font-semibold">CMV Total: R$ {calcularCMV()}</div>
        </div>
      )}

      {aba === "painel" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Gráfico de Consumo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gerarDadosGrafico()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="produto" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
