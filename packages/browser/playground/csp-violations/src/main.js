if (!window.__agridObservedViolations) {
    window.__agridObservedViolations = []
}

if (window.ReportingObserver) {
    const observer = new window.ReportingObserver(
        (reports) => {
            reports.forEach((violation) => {
                console.log(violation)
                window.__agridObservedViolations.push(violation)
            })
        },
        {
            types: ['csp-violation'],
        }
    )
    observer.observe()
}
