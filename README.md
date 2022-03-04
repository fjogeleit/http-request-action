# HTTP Request Action

**Create HTTP Requests from GitHub Actions.** This action allows GitHub events to engage with tools like Ansible AWX that use HTTP APIs.

### Example
```yaml
jobs:
  deployment:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy Stage
      uses: fjogeleit/http-request-action@v1
      with:
        url: 'https://ansible.io/api/v2/job_templates/84/launch/'
        method: 'POST'
        username: ${{ secrets.AWX_USER }}
        password: ${{ secrets.AWX_PASSWORD }}
```

### Versioning

`master` branch is deprecated. Please use `main` or `v1` to get the latest version of this action. It is recommended to use a fixed version.

### Request Configuration

|Argument|  Description  |  Default  |
|--------|---------------|-----------|
|url     | Request URL   | _required_ Field |
|method  | Request Method| POST |
|contentType  | Request ContentType| application/json |
|data    | Request Body Content:<br>- text content like JSON or XML<br>- key=value pairs separated by '&' and contentType: application/x-www-form-urlencoded<br><br>only for POST / PUT / PATCH Requests | '{}' |
|files    | Map of key / absolute file paths send as multipart/form-data request to the API, if set the contentType is set to multipart/form-data, values provided by data will be added as additional FormData values, nested objects are not supported. **Example provided in the _test_ Workflow of this Action** | '{}' |
|file    | Single absolute file path send as `application/octet-stream` request to the API, if set the contentType is set to `application/octet-stream`. This input will be ignored if either `data` or `files` input is present. **Example provided in the _test_ Workflow of this Action** ||
|timeout| Request Timeout in ms | 5000 (5s) |
|username| Username for Basic Auth ||
|password| Password for Basic Auth ||
|bearerToken| Bearer Authentication Token (without Bearer Prefix) ||
|customHeaders| Additional header values as JSON string, keys in this object overwrite default headers like Content-Type |'{}'|
|escapeData| Escape newlines in data string content. Use 'true' (string) as value to enable it ||
|preventFailureOnNoResponse| Prevent this Action to fail if the request respond without an response. Use 'true' (string) as value to enable it ||
|ignoreStatusCodes| Prevent this Action to fail if the request respond with one of the configured Status Codes. Example: '404,401' ||

### Response

| Variable |  Description  |
|---|---|
`response` | Response as JSON String

To display HTTP response data in the GitHub Actions log give the request an `id` and access its `outputs`

```yaml
steps:
  - name: Make Request
    id: myRequest
    uses: fjogeleit/http-request-action@v1
    with:
      url: "http://yoursite.com/api"
  - name: Show Response
    run: echo ${{ steps.myRequest.outputs.response }}
```

### Additional Information

Additional information is available if debug logging is enabled:
- Instance Configuration (Url / Timeout / Headers)
- Request Data (Body / Auth / Method)

To [enable debug logging in GitHub Actions](https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging) create a secret `ACTIONS_RUNNER_DEBUG` with a value of `true`
