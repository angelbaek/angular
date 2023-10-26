// npm package: apexcharts
// github link: https://github.com/apexcharts/apexcharts.js

$(function () {
  "use strict";

  var colors = {
    primary: "rgba(20, 60, 117, .25)",
    secondary: "#7987a1",
    success: "#05a34a",
    info: "#66d1d1",
    warning: "#fbbc06",
    danger: "#ff3366",
    light: "#e9ecef",
    dark: "#060c17",
    muted: "#7987a1",
    gridBorder: "",
    bodyColor: "#000",
    cardBg: "",
  };

  // var fontFamily = "'Noto sans', Helvetica, sans-serif";
  var fontFamily = "'pretendard', Helvetica, sans-serif";

  // Apex Bar chart end
  // Apex Bar chart start
  if ($("#apexBar2").length) {
    var options = {
      chart: {
        type: "bar",
        height: "110",
        parentHeightOffset: 1,
        foreColor: colors.bodyColor,
        background: colors.cardBg,
        stacked: true,

        toolbar: {
          show: false,
        },
        sparkline: {
          enabled: false,
        },
      },
      theme: {
        mode: "light",
      },
      tooltip: {
        theme: "light",
      },
      colors: [colors.primary],
      grid: {
        padding: {
          bottom: -4,
        },
        borderColor: colors.gridBorder,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      series: [
        {
          name: "",
          data: [21, 7, 25, 13, 22, 8, 19, 46, 35],
        },
      ],
      xaxis: {
        type: "num",
        categories: [
          "2015",
          "2016",
          "2017",
          "2018",
          "2019",
          "2020",
          "2021",
          "2022",
          "2023",
        ],
        axisBorder: {
          color: colors.gridBorder,
        },
        axisTicks: {
          color: colors.gridBorder,
        },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "center",
        fontFamily: fontFamily,
        itemMargin: {
          horizontal: 8,
          vertical: 0,
        },
      },
      stroke: {
        width: 0,
      },
      plotOptions: {
        bar: {
          borderRadius: 2,
          columnWidth: "60%",
        },
      },
    };

    var apexBarChart = new ApexCharts(
      document.querySelector("#apexBar2"),
      options
    );
    apexBarChart.render();
  }
  // Apex Bar chart end
});
