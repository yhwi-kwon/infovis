document.getElementById("comboBox").addEventListener("change", function () {
  const selectedFile = this.value;
  loadData(selectedFile);
});

// 초기 데이터 로드
loadData(document.getElementById("comboBox").value);

// 데이터 로드 및 전처리 함수
// 데이터 로드 및 전처리 함수
function loadData(fileName) {
  d3.select("#pieChart").selectAll("*").remove(); // Pie Chart 초기화
  d3.select("#pyramidChart").selectAll("*").remove(); // Pyramid Chart 초기화

  d3.csv(
    `https://raw.githubusercontent.com/yhwi-kwon/infovis/main/${fileName}`
  ).then((data) => {
    data.forEach((d) => {
      d["출산율"] = +d["출산율"];
      d["행정기관코드"] = +d["행정기관코드"];
    });

    // 상위 10개, 하위 10개 출산율 데이터
    const top10 = data.sort((a, b) => b["출산율"] - a["출산율"]).slice(0, 10);
    const bottom10 = data
      .sort((a, b) => a["출산율"] - b["출산율"])
      .slice(0, 10);

    // 라디오 버튼 이벤트 리스너
    d3.selectAll("input[name='filter']").on("change", updateChart);

    // 초기 차트 표시
    updateChart();

    function createTooltip() {
      return d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("text-align", "center");
    }

    function updateChart() {
      const filterValue = d3
        .select("input[name='filter']:checked")
        .node().value;
      const chartData = filterValue === "top10" ? top10 : bottom10;

      // 차트 설정
      const margin = { top: 40, right: 20, bottom: 100, left: 60 };
      const width = 960 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      d3.select("#barChart").selectAll("*").remove();
      const svg = d3
        .select("#barChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand().range([0, width]).padding(0.1);
      const y = d3.scaleLinear().range([height, 0]);

      x.domain(chartData.map((d) => d["읍면동명"]));
      y.domain([0, d3.max(chartData, (d) => d["출산율"])]);

      // 그라데이션 색상 설정
      const color = d3
        .scaleLinear()
        .domain([0, d3.max(chartData, (d) => d["출산율"])])
        .range(["#d1e2f3", "#08306b"]);

      const tooltip = createTooltip();

      svg
        .selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d["읍면동명"]))
        .attr("width", x.bandwidth())
        .attr("y", (d) => y(0))
        .attr("height", 0)
        .attr("fill", (d) => color(d["출산율"]))
        .on("mouseover", function (event, d) {
          tooltip
            .html(
              `<strong>${d["읍면동명"]}</strong><br>출산율: ${d[
                "출산율"
              ].toFixed(2)}`
            )
            .style("visibility", "visible");
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        })
        .on("click", function (event, d) {
          drawPieChart(d["행정기관코드"]);
          drawPyramidChart(d["행정기관코드"]);
        })
        .transition()
        .duration(800)
        .attr("y", (d) => y(d["출산율"]))
        .attr("height", (d) => height - y(d["출산율"]));

      svg
        .selectAll(".label")
        .data(chartData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => x(d["읍면동명"]) + x.bandwidth() / 2)
        .attr("y", (d) => y(d["출산율"]) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "black")
        .text((d) => d["출산율"].toFixed(2));

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("dx", "-.8em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "14px");

      svg
        .append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "14px");

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("출산율 상위 10개 or 하위 10개 동네");
    }
    ///////////////////////////////////////////////////////////////////////////////

    function drawPieChart(code) {
      const filteredData = data.filter((d) => d["행정기관코드"] === code)[0];

      const ageGroups = [
        "0대",
        "10대",
        "20대",
        "30대",
        "40대",
        "50대",
        "60대",
        "70대",
        "80대이상",
      ];
      const pieData = ageGroups.map((age) => ({
        age,
        value:
          parseInt(filteredData[`${age}남자`]) +
          parseInt(filteredData[`${age}여자`]),
      }));

      const total = pieData.reduce((acc, cur) => acc + cur.value, 0);

      const margin = { top: 20, right: 20, bottom: 70, left: 40 };
      const width = 500;
      const height = 500;
      const radius = Math.min(width, height) / 2 - margin.top;

      d3.select("#pieChart").selectAll("*").remove();
      const svg = d3
        .select("#pieChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      const color = d3
        .scaleOrdinal()
        .domain(ageGroups)
        .range(d3.schemeCategory10);

      const pie = d3.pie().value((d) => d.value);
      const data_ready = pie(pieData);
      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      const tooltip = createTooltip();

      svg
        .selectAll("slices")
        .data(data_ready)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data.age))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
          tooltip
            .html(
              `<strong>${d.data.age}</strong><br>인구: ${
                d.data.value
              }<br>비율: ${((d.data.value / total) * 100).toFixed(2)}%`
            )
            .style("visibility", "visible");
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        })
        .transition()
        .attrTween("d", function (d) {
          const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
          return function (t) {
            d.endAngle = i(t);
            return arc(d);
          };
        });

      svg
        .selectAll("slices")
        .data(data_ready)
        .enter()
        .append("text")
        .text((d) => `${d.data.age}`)
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", 14);
    }
    ///////////////////////////////////////////////////////////////////////////////

    function drawPyramidChart(code) {
      const filteredData = data.filter((d) => d["행정기관코드"] === code)[0];

      const ageGroups = [
        "0대",
        "10대",
        "20대",
        "30대",
        "40대",
        "50대",
        "60대",
        "70대",
        "80대이상",
      ];
      const maleData = ageGroups.map((age) => ({
        age,
        value: filteredData[`${age}남자`],
      }));
      const femaleData = ageGroups.map((age) => ({
        age,
        value: filteredData[`${age}여자`],
      }));

      const margin = { top: 20, right: 20, bottom: 70, left: 40 };
      const width = 500 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      d3.select("#pyramidChart").selectAll("*").remove();
      const svg = d3
        .select("#pyramidChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleLinear()
        .domain([0, d3.max([...maleData, ...femaleData], (d) => d.value)])
        .range([0, width / 4 / 2 - 1]); // 너무 값이 큰 경우 있어 나눠줌

      const y = d3
        .scaleBand()
        .domain(ageGroups)
        .range([height, 0])
        .padding(0.1);

      const colorScaleMale = d3
        .scaleLinear()
        .domain([0, d3.max(maleData, (d) => d.value)])
        .range(["#add8e6", "#0000fa"]);

      const colorScaleFemale = d3
        .scaleLinear()
        .domain([0, d3.max(femaleData, (d) => d.value)])
        .range(["#ffb6c1", "#ff1493"]);

      const tooltip = createTooltip();

      svg
        .selectAll(".bar.male")
        .data(maleData)
        .enter()
        .append("rect")
        .attr("class", "bar male")
        .attr("x", (d) => width / 2 - x(d.value))
        .attr("width", (d) => x(d.value))
        .attr("y", (d) => y(d.age))
        .attr("height", y.bandwidth())
        .attr("fill", (d) => colorScaleMale(d.value))
        .on("mouseover", function (event, d) {
          tooltip
            .html(`<strong>${d.age} 남자</strong><br>인구: ${d.value}`)
            .style("visibility", "visible");
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        })
        .attr("width", (d) => x(d.value));

      svg
        .selectAll(".bar.female")
        .data(femaleData)
        .enter()
        .append("rect")
        .attr("class", "bar female")
        .attr("x", width / 2)
        .attr("width", (d) => x(d.value))
        .attr("y", (d) => y(d.age))
        .attr("height", y.bandwidth())
        .attr("fill", (d) => colorScaleFemale(d.value))
        .on("mouseover", function (event, d) {
          tooltip
            .html(`<strong>${d.age} 여자</strong><br>인구: ${d.value}`)
            .style("visibility", "visible");
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        })
        .attr("width", (d) => x(d.value));

      svg
        .append("g")
        .attr("transform", `translate(${width / 2},0)`)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "14px");
    }
  });
}
