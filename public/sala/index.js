const app = new Vue({

    el: '#app',
    data(){
        return {
            salaSelecionada:1,
            listaAvisos:[],
            numItens:10,
            vetorGraficoMovimento:[],
            vetorGraficoLuz:[]
        }
    },
    mounted: async function(){
        this.salaSelecionada = window.location.pathname.substring(window.location.pathname.length-1);
        //console.log(this.salaSelecionada)
        await this.carregaUltimosAvisosSalas();
        this.listaAvisos = await this.requisitaListaAvisos();
        await this.geraVetorGraficoMovimento();
        await this.geraVetorGraficoLuz();
        this.renderChartMovimento();
        this.renderChartLuz();
        await this.carregaUltimoValorDefinido();
    },

    methods:{
        async carregaUltimoValorDefinido(){
          let url = `/getUltimoValorPadrao?idSensor=${this.salaSelecionada}`;
          let response = await axios.get(url);
          let vlBaseDistAtual = document.getElementById('vlBaseDistAtual');
          let vlBaseLumAtual = document.getElementById('vlBaseLumAtual');
          if(response.data.vlBaseDistAtual)
            vlBaseDistAtual.innerHTML = `<strong>Valor base/distância (cm) atual:</strong> ${response.data.vlBaseDistAtual}`
          if(response.data.vlBaseLumAtual)
          vlBaseLumAtual.innerHTML = `<strong>Valor base/luminosidade atual:</strong> ${response.data.vlBaseLumAtual}`
        },

        async carregaUltimosAvisosSalas(){
            let ultimoAvisoSala1 = await this.getUltimoAlerta('D1MINI_PRO');
            let ultimoAvisoSala2 = await this.getUltimoAlerta('NODEMCU'); 
            let ultimoAvisoSala3 = await this.getUltimoAlerta('D1_MINI');
            try{
              const dataAtual = new Date();
              const dataLimite = new Date(dataAtual.getTime() - 5 * 60 * 1000);
              const card1 = document.getElementById('card1')
              const card2 = document.getElementById('card2')
              const card3 = document.getElementById('card3')

              if(ultimoAvisoSala1){
                ultimoAvisoSala1 = new Date(ultimoAvisoSala1[0].dataAlerta);
                if(ultimoAvisoSala1 > dataLimite){
                  //console.log("O ultimo aviso da sala 1 foi a menos de 5 min")
                  card1.classList.add('fundo_grad_vermelho');
                }
                else{
                  card1.classList.add('fundo_grad_azul');
                 // console.log("O ultimo aviso da sala 1 foi a mais de 5 min")
                }  
                const date = new Date(ultimoAvisoSala1);
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const formattedDate = `${hours}:${minutes} - ${day}/${month}`;
                //console.log(formattedDate)
                const horarioUltimoAlertaSala1 = document.getElementById('horarioUltimoAlertaSala1')
                horarioUltimoAlertaSala1.innerHTML = `<strong>Ultimo Alerta:</strong> ${formattedDate}`;
              }
              else{
                card1.classList.add('fundo_grad_cinza');
              }

              if(ultimoAvisoSala2){
                ultimoAvisoSala2 = new Date(ultimoAvisoSala2[0].dataAlerta);
                if(ultimoAvisoSala2 > dataLimite){
                  card2.classList.add('fundo_grad_vermelho');
                  //console.log("O ultimo aviso da sala 2 foi a menos de 5 min")
                }
                else{
                  card2.classList.add('fundo_grad_azul');
                  //console.log("O ultimo aviso da sala 2 foi a mais de 5 min")
                }
                const date = new Date(ultimoAvisoSala2);
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const formattedDate = `${hours}:${minutes} - ${day}/${month}`;
                //console.log(formattedDate)
                const horarioUltimoAlertaSala2 = document.getElementById('horarioUltimoAlertaSala2')
                horarioUltimoAlertaSala2.innerHTML = `<strong>Ultimo Alerta:</strong> ${formattedDate}`;
              }
              else{
                card2.classList.add('fundo_grad_cinza');
                
              }
              if(ultimoAvisoSala3){
                ultimoAvisoSala3 = new Date(ultimoAvisoSala3[0].dataAlerta);
                if(ultimoAvisoSala3 > dataLimite){
                  card3.classList.add('fundo_grad_vermelho');
                 // console.log("O ultimo aviso da sala 3 foi a menos de 5 min")
                }
                else{
                  card3.classList.add('fundo_grad_azul');
                  //console.log("O ultimo aviso da sala 3 foi a mais de 5 min")
                }
                const date = new Date(ultimoAvisoSala3);
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const formattedDate = `${hours}:${minutes} - ${day}/${month}`;
                //console.log(formattedDate)
                const horarioUltimoAlertaSala3 = document.getElementById('horarioUltimoAlertaSala3')
                horarioUltimoAlertaSala3.innerHTML = `<strong>Ultimo Alerta:</strong> ${formattedDate}`;
              }
              else{
                card3.classList.add('fundo_grad_cinza');
              }
            }
            catch(err){
              console.log(err)
            }
            

        },

        mudaSalaSelecionada(sala){
            location.href = `/sala/${sala}`
        },

        async getUltimoAlerta(sensor){
          let url = `/getUltimoAlerta?sensor=${sensor}`;
          let response = await axios.get(url);
          return response.data;
        },

        async requisitaListaAvisos(nomePlaca,numItens,ListaDeidTipoAlerta){
            let url = ``;

            if(nomePlaca == undefined)
                nomePlaca = this.getSalaPeloID();
            if(numItens == undefined)
                numItens = this.numItens

            if(ListaDeidTipoAlerta != undefined){
              url = `/getAlertas?sensor=${nomePlaca}&limite=${numItens}&idTipoAlerta=${ListaDeidTipoAlerta}` 
            }
            else if(ListaDeidTipoAlerta == undefined){
              url = `/getAlertas?sensor=${nomePlaca}&limite=${numItens}&idTipoAlerta=0,1,2,3` 
            }
            
           // console.log(url)
          
            try {
              let response = await axios.get(url);
              let data = response.data;
              let responseList = [];

              for (let i = 0; i < data.length; i++) {
                  let registro = data[i];
                  let obj = {};
                  const date = new Date(registro.dataAlerta);
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const formattedDate = `${hours}:${minutes} - ${day}/${month}`;
                  obj.data = formattedDate;
                  obj.valLuz = registro.valLuz;
                  obj.valMovimento = registro.valMovimento;
                  obj.idTipoAlerta = registro.idTipoAlerta === null ? 0 : registro.idTipoAlerta;
                  responseList.push(obj);
                  }

                  return responseList;
              } catch (error) {
                  console.error("Erro ao requisitar lista de avisos:", error);
                  return [];
              }
        },
        getSalaPeloID(){
            let nomePlaca = "";

            if(this.salaSelecionada == 1){
                nomePlaca = "D1MINI_PRO"
            }
            else if(this.salaSelecionada == 2){
                nomePlaca = "NODEMCU"
            }
            else{
              nomePlaca = "D1_MINI";
            }

            return nomePlaca;
        },
        getClass(idTipoAlerta) {
            return idTipoAlerta === 0 ? 'list-group-item-primary' : 'list-group-item-danger';
          },
          getMessage(idTipoAlerta) {
            switch (idTipoAlerta) {
              case 0:
                return 'Comunicação com sensor OK';
              case 1:
                return 'Mudança de luz detectada!';
              case 2:
                return 'Movimento Detectado!';
              case 3:
                return 'Mudança de luz e movimento!';
              default:
                return 'Alerta desconhecido';
            }
          },

          async atualizaNumItens(numItens){
            this.numItens = numItens;
            this.listaAvisos = await this.requisitaListaAvisos();
          },
          handleSelectChange(event) {
            const numItens = parseInt(event.target.value, 10);
            this.atualizaNumItens(numItens);
          },
          async geraVetorGraficoMovimento(){
            let vet = []
            vet =  await this.requisitaListaAvisos(undefined,25,[2,3,0]);
            let vetCores = []
            let vetValores = []
            let vetLabels = []
            for(let i = 0; i < vet.length; i++){
              let v = vet[i];
              vetValores.push(v.valMovimento);
              vetLabels.push(v.data);
              if(v.idTipoAlerta == 3 || v.idTipoAlerta == 2 || v.idTipoAlerta == 1){
                vetCores.push('rgb(255, 0, 0)')
              }
              else{
                vetCores.push('rgb(0, 117, 227)')
              }
            }
            this.vetorGraficoMovimento = [vetLabels.reverse(), vetValores.reverse(), vetCores.reverse()];
          },
          async geraVetorGraficoLuz(){
            let vet = []
            vet =  await this.requisitaListaAvisos(undefined,25,[0,1,3]);
            let vetCores = []
            let vetValores = []
            let vetLabels = []
            for(let i = 0; i < vet.length; i++){
              let v = vet[i];
              vetValores.push(v.valLuz);
              vetLabels.push(v.data);
              if(v.idTipoAlerta == 3 || v.idTipoAlerta == 2 || v.idTipoAlerta == 1){
                vetCores.push('rgb(255, 0, 0)')
              }
              else{
                vetCores.push('rgb(0, 117, 227)')
              }
            }
            this.vetorGraficoLuz = [vetLabels.reverse(), vetValores.reverse(), vetCores.reverse()];
          },

          renderChartMovimento() {
            let vetorGraficoMovimento = this.vetorGraficoMovimento;
            const ctx = document.getElementById('chartDistancia').getContext('2d');

            const data = {
                labels: vetorGraficoMovimento[0],
                datasets: [{
                    label: 'Leitura do sensor de distância',
                    data: vetorGraficoMovimento[1],
                    borderColor: 'rgb(0, 117, 227)',
                    borderWidth: 2,
                    pointBackgroundColor: vetorGraficoMovimento[2],
                    pointBorderColor: vetorGraficoMovimento[2],
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            };

            const config = {
                type: 'line',
                data: data,
                options: {
                    plugins: {
                        autocolors: false,
                        annotation: false
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                },
                plugins: [{
                    id: 'lineColorChange',
                    beforeDraw: (chart) => {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        const meta = chart.getDatasetMeta(0);
                        const data = meta.data;

                        ctx.save();
                        for (let i = 0; i < data.length - 1; i++) {
                            const start = data[i];
                            const end = data[i + 1];
                            const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
                            gradient.addColorStop(0, chart.data.datasets[0].pointBorderColor[i]);
                            gradient.addColorStop(1, chart.data.datasets[0].pointBorderColor[i + 1]);

                            ctx.strokeStyle = gradient;
                            ctx.lineWidth = chart.data.datasets[0].borderWidth;
                            ctx.beginPath();
                            ctx.moveTo(start.x, start.y);
                            ctx.lineTo(end.x, end.y);
                            ctx.stroke();
                        }
                        ctx.restore();
                    }
                }]
            };

            new Chart(ctx, config);
        },
        renderChartLuz() {
          //console.log(this.vetorGraficoLuz)
          let vetorGraficoLuz = this.vetorGraficoLuz;
          const ctx = document.getElementById('chartLuz').getContext('2d');

          const data = {
              labels: vetorGraficoLuz[0],
              datasets: [{
                  label: 'Leitura do sensor de luminosidade',
                  data: vetorGraficoLuz[1],
                  borderColor: 'rgb(0, 117, 227)',
                  borderWidth: 2,
                  pointBackgroundColor: vetorGraficoLuz[2],
                  pointBorderColor: vetorGraficoLuz[2],
                  pointRadius: 5,
                  pointHoverRadius: 7,
              }]
          };

          const config = {
              type: 'line',
              data: data,
              options: {
                  plugins: {
                      autocolors: false,
                      annotation: false
                  },
                  scales: {
                      y: {
                          beginAtZero: true
                      }
                  },
              },
              plugins: [{
                  id: 'lineColorChange',
                  beforeDraw: (chart) => {
                      const ctx = chart.ctx;
                      const chartArea = chart.chartArea;
                      const meta = chart.getDatasetMeta(0);
                      const data = meta.data;

                      ctx.save();
                      for (let i = 0; i < data.length - 1; i++) {
                          const start = data[i];
                          const end = data[i + 1];
                          const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
                          gradient.addColorStop(0, chart.data.datasets[0].pointBorderColor[i]);
                          gradient.addColorStop(1, chart.data.datasets[0].pointBorderColor[i + 1]);

                          ctx.strokeStyle = gradient;
                          ctx.lineWidth = chart.data.datasets[0].borderWidth;
                          ctx.beginPath();
                          ctx.moveTo(start.x, start.y);
                          ctx.lineTo(end.x, end.y);
                          ctx.stroke();
                      }
                      ctx.restore();
                  }
              }]
          };

          new Chart(ctx, config);
      },
      async mudarParametrosEsp(){
        let vlBaseDist = document.getElementById('vlBaseDist');
        let vlBaseLum = document.getElementById('vlBaseLum');
        vlBaseDist = vlBaseDist.value;
        vlBaseLum = vlBaseLum.value;
        let disp = this.getSalaPeloID(); 

        if(vlBaseDist || vlBaseLum){
          let resp = await axios.put(`/setarNovosParametros`,{
            dispositivo: disp,
            vlBaseDist: vlBaseDist,
            vlBaseLum: vlBaseLum
          })
          if(resp.status == 200){
            let divAlerta = document.getElementById('alertas');
                divAlerta.innerHTML = `
                <div class="alert alert-success alertaPop" wrole="alert">
                  <div style="width:100%; text-align: center">
                    Salvo com sucesso!
                  </div>
              </div>`

            setTimeout(() => {
              divAlerta.innerHTML = '';
              let vlBaseDistAtual = document.getElementById('vlBaseDistAtual');
              let vlBaseLumAtual = document.getElementById('vlBaseLumAtual');
              if(vlBaseDist){
                vlBaseDistAtual.innerHTML = `<strong>Valor base/distância (cm) atual:</strong> ${vlBaseDist}`
              }
              if(vlBaseLum){
                vlBaseLumAtual.innerHTML = `<strong>Valor base/luminosidade atual:</strong> ${vlBaseLum}`
              }

            }, 700);
          }

          document.getElementById('vlBaseDist').value = ''
          document.getElementById('vlBaseLum').value = ''
        }

      }


    }
})